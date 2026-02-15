import { ServiceBase,DaoBase,
    TenantStandardEntityBase, StandardEntityBase,
    ID_GENERATOR, Status } from "@/nsdk/base";
import * as uuid from 'uuid';
import { LibService } from "./lib";


/** 内容转码状态 */
export enum TranscodeStatus {
    /** 无需转码 */
    NONEED = 'noneed',
    /** 待转码 */
    PENDING = 'pending',
    /** 转码完成 */
    COMPLETED = 'completed',
    /** 转码失败 */
    FAILED = 'failed'
}

/** 内容审核状态 */
export enum AuditStatus {
    /** 无需审核 */
    NONEED = 'noneed',
    /** 待提交审核 */
    TOBESUBMIT = 'tobesubmit',
    /** 待审核 */
    PENDING = 'pending',
    /** 审核通过 */
    APPROVED = 'approved',
    /** 审核拒绝 */
    REJECTED = 'rejected'
}

/** 内容发布状态 */
export enum PublishStatus {
    /** 待发布 */
    PENDING = 'pending',
    /** 已发布 */
    PUBLISHED = 'published',
    /** 已下线 */
    UNPUBLISHED = 'unpublished'
}

/**
 * 内容版本工具类
 * 版本格式：主版本.次版本.修订号
 * 初始化版本：0.0.0
 * 增加主版本：X.0.0
 * 增加次版本：X.Y.0
 * 增加修订号：X.Y.Z
 */
export class ContentVersion {
    private ver:number[] = [0,0,0];
    constructor(version: string | undefined) {
        if(version) {
            const parts = version.split('.').map(v => Number(v));
            for(let i=0; i<Math.min(parts.length, 3); i++) {
                this.ver[i] = parts[i];
            }
        } else {
            this.ver = [0,0,0];
        }
    }
    static getInitialVersion(): string {
        return '0.0.0';
    }
    toString(): string {
        return this.ver.join('.');
    }

    /** 更新主版本号 */
    bumpMajor(): string {
        this.ver[0] += 1;
        this.ver[1] = 0;
        this.ver[2] = 0;
        return this.toString();
    }
    /** 更新次版本号 */
    bumpMinor(): string {
        this.ver[1] += 1;
        this.ver[2] = 0;
        return this.toString();
    }
    /** 更新修订号 */
    bumpPatch(): string {
        this.ver[2] += 1;
        return this.toString();
    }
}

export class ContentType extends StandardEntityBase {
    /** 内容类型名称 */
    name?: string;
    /** 内容类型描述 */
    description?: string;
    /** 是否需要转码 */
    need_transcode?: boolean;
    /** 内容类型元数据，JSON字符串或JSON对象 */
    config?: any;
    /** 状态 */
    status?: Status;
}

export class ContentTypeDao extends DaoBase {
    constructor() {
        super('dcm_content_type', 'dcm', {
            multi_tenant: false,
            id_generator: ID_GENERATOR.NONE,
            json_fields: ['config']
        });
    }
}

export class ContentTypeService extends ServiceBase<ContentType> {
    constructor() {
        super(new ContentTypeDao());
    }
    async needTranscode(content_type: string): Promise<boolean> {
        let contentType:ContentType = await this.dao.get(content_type);
        return contentType.need_transcode?true:false;
    }
}

/**
 * 内容实体
 */
export class Content extends TenantStandardEntityBase {
    /** 所属内容库 */
    lib_id?: number;
    /** 内容唯一标识 */
    content_uuid?: string;
    /** 内容类型，如 video, image, document 等 */
    content_type?: string;
    /** 内容标题 */
    title?: string;
    /** 内容摘要 */
    summary?: string;
    /** 关内容缩略图URL */
    thumbnail?: string;
    /** 转码状态 */
    transcode_status?: TranscodeStatus;
    /** 审核状态 */
    audit_status?: AuditStatus;
    /** 发布状态 */
    publish_status?: PublishStatus;
    /** 排序号 */
    sort_num?: number;
    /** 是否置顶 */
    is_top?: boolean;

    /** 版本号 */
    version?: string;

    /** 内容数据，JSON字符串或JSON对象 */
    data?: any;
    /** 内容相关的知识点相关数据，JSON字符串或JSON对象 */
    kn?: any;

    /** 内容分类，分类末级id, 如 id3 */
    category?: string;
    /** 内容分类路径，如 "id1:id2:id3" */
    category_path?: string;
    /** 内容相关的标签数据，JSON字符串或JSON对象，格式：{"${key}": "string"} */
    tags?: any;

    /** 扩展数据，JSON字符串或JSON对象 */
    ext?: any;

    /** 是否为引用的资源 */
    is_ref?: boolean;
}

export class ContentDao extends DaoBase {
    constructor() {
        super('dcm_content', 'dcm', {
            json_fields: ['data', 'kn', 'tags', 'ext']
        });
    }
}

export class ContentService extends ServiceBase<Content> {
    content_type_service: ContentTypeService;
    lib_service: LibService;
    constructor(content_type_service: ContentTypeService, lib_service: LibService) {
        super(new ContentDao());
        this.content_type_service = content_type_service;
        this.lib_service = lib_service;
    }
    async _getDefaultTranscodeStatus(content_type: string): Promise<TranscodeStatus> {
        if(await this.content_type_service.needTranscode(content_type)) {
            return TranscodeStatus.PENDING;
        } else {
            return TranscodeStatus.NONEED;
        }
    }
    async _getDefaultAuditStatus(lib_id: number): Promise<AuditStatus> {
        if(await this.lib_service.needAudit(lib_id)) {
            return AuditStatus.TOBESUBMIT;
        } else {
            return AuditStatus.NONEED;
        }
    }
    _getDefaultPublishStatus(): PublishStatus {
        return PublishStatus.PENDING;
    }

    async add_content(data: Content): Promise<{result: boolean, id?: any}> {
        let lib_id = data.lib_id;
        // data.lib_id = lib_id;
        if(!lib_id) {
            throw new Error('lib_id is required');
        }
        let content_type = data.content_type || (data.data && data.data.type) || '';
        data.transcode_status = await this._getDefaultTranscodeStatus(content_type);
        data.audit_status = await this._getDefaultAuditStatus(lib_id);
        data.publish_status = this._getDefaultPublishStatus();
        data.content_uuid = uuid.v4();//data.content_uuid || 
        data.is_top = false;
        data.is_ref = false;
        data.version = ContentVersion.getInitialVersion();

        return super.add(data);
    }
    async add_ref(lib_id: number, source_lib_id: number, source_content_uuid: string, source_version?: string): Promise<{result: boolean, id?: any}> {
        let source_content = await this.dao.findOne({ conditions: { lib_id: source_lib_id, content_uuid: source_content_uuid, version: source_version } });
        if(!source_content) {
            throw new Error(`Source content not found: lib_id=${source_lib_id}, content_uuid=${source_content_uuid}, version=${source_version}`);
        }

        const content:Content = {
            lib_id: lib_id,
            content_uuid: source_content_uuid,
            is_ref: true,
            version: ContentVersion.getInitialVersion(),
            data: {}
        };
        return this.add_content(content);
    }

    /** 提交审核 */
    async submit_audit(id: number, lib_id: number): Promise<any> {
        const content = await this.get(id);
        if(!content) {
            throw new Error(`Content not found: ${id}`);
        }
        if(content.audit_status !== AuditStatus.TOBESUBMIT && content.audit_status !== AuditStatus.REJECTED) {
            throw new Error(`Content is not in a state that can be submitted for audit: ${id}`);
        }
        // TODO: 触发审核流程
        content.audit_status = AuditStatus.PENDING;
        await this.update(id, content);
        return {result: true};
    }
    /** 撤回提交审核 */
    async try_withdraw_audit(id: number, lib_id: number): Promise<any> {
        const content = await this.get(id);
        if(!content) {
            throw new Error(`Content not found: ${id}`);
        }
        if(content.audit_status !== AuditStatus.PENDING) {
            throw new Error(`Content is not in a state that can be withdrawn from audit: ${id}`);
        }
        // TODO: 触发审核流程的撤回
        content.audit_status = AuditStatus.TOBESUBMIT;
        await this.update(id, content);
        return {result: true};
    }
    /** 反馈审核结果 */
    async feedback_audit(id: number, lib_id: number, approved: boolean, reason?: string): Promise<any> {
        const content = await this.get(id);
        if(!content) {
            throw new Error(`Content not found: ${id}`);
        }
        if(content.audit_status !== AuditStatus.PENDING) {
            throw new Error(`Content is not in a state that can receive audit feedback: ${id}`);
        }
        let update_data:any = {};
        if(approved) {
            update_data.audit_status = AuditStatus.APPROVED;
        } else {
            update_data.audit_status = AuditStatus.REJECTED;
            if(reason) {
                update_data.ext = { ...content.ext, audit_reject_reason: reason };
            } else {
                update_data.ext = { ...content.ext, audit_reject_reason: '未提供拒绝理由' };
            }
        }

        // TODO: 根据审核结果，判断版本号是否需要更新
        let new_version = new ContentVersion(content.version).bumpMinor();
        update_data.version = new_version;

        await this.update(id, update_data);
    }
    /** 发布 */
    async publish(id: number, lib_id: number): Promise<any> {
        const content = await this.get(id);
        if(!content) {
            throw new Error(`Content not found: ${id}`);
        }
        if(content.publish_status === PublishStatus.PUBLISHED) {
            throw new Error(`Content is already published: ${id}`);
        }
        

        // 更新版本号
        if(!content.version) {
            const ver = new ContentVersion(content.version || '0.0.0');
            content.version = ver.bumpMinor();
        }
        // 更新发布状态
        content.publish_status = PublishStatus.PUBLISHED;
        await this.update(id, content);

        // TODO: 触发发布事件

        return {result: true};
    }
    /** 取消发布，下线 */
    async unpublish(id: number, lib_id: number): Promise<any> {
        await this.update(id, { publish_status: PublishStatus.UNPUBLISHED });
        return {result: true};
    }
    async update_data(id: number, data: any, lib_id: number): Promise<any> {
        data.lib_id = lib_id;
        await this.update(id, { data: data });
        // TODO：判断是否需要重新触发转码
        return {result: true};
    }
    async set_kn(id: number, kn: any, lib_id: number): Promise<any> {
        let content = await this.get(id);
        let new_version = new ContentVersion(content.version).bumpMinor();
        await this.update(id, { kn: kn, version: new_version });
        return {result: true};
    }
    async set_tags(id: number, tags: any, lib_id: number): Promise<any> {
        let content = await this.get(id);
        let new_version = new ContentVersion(content.version).bumpPatch();
        await this.update(id, { tags: tags, version: new_version });
        return {result: true};
    }
    async set_category(id: number, category_id: string, lib_id: number): Promise<any> {
        // TODO: 需要查询分类表，获取完整路径
        const category_path = category_id;
        let content = await this.get(id);
        let new_version = new ContentVersion(content.version).bumpPatch();
        await this.update(id, { category: category_id, category_path: category_path, version: new_version });
        return {result: true};
    }
    async set_lectures(id: number, lectures: number[], lib_id: number): Promise<any> {
        let content = await this.get(id);
        let new_version = new ContentVersion(content.version).bumpPatch();
        await this.update(id, { ext: { ...content.ext, lectures: lectures }, version: new_version });
        return {result: true};
    }
    async set_providers(id: number, providers: number[], lib_id: number): Promise<any> {
        let content = await this.get(id);
        let new_version = new ContentVersion(content.version).bumpPatch();
        await this.update(id, { ext: { ...content.ext, providers: providers }, version: new_version });
        return {result: true};
    }
    async set_top(id: number, lib_id: number): Promise<any> {
        await this.update(id, { is_top: true });
        return {result: true};
    }
    async unset_top(id: number, lib_id: number): Promise<any> {
        await this.update(id, { is_top: false });
        return {result: true};
    }
}