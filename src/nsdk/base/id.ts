"use strict";

/**
 * 基于雪花算法的id生成器，配合数据库需要用64位（mysql对应为bigint）
 * 由于js中64位的安全范围在前52位，所以暂定52位分配为：
 * 时间差39位，可用17年
 * 机器占1位，两台
 * 进程占3位，8进程
 * 序列占9位，512，但溢出时通过调整时间差进行补偿，但一旦补偿调整的时间差超过10毫秒，则抛出异常。
 * 若服务器时间回调到之前的时间，有可能产生id冲突
 */
let process_id = 0;
let dc_id = 0;
let max_seq = 0;

let seq_bits = 9;    //序列占9位，0~511
let proc_bits = 3;  //进程号占3位，0~7
let dc_bits = 1;    //机器占1位，0~1

let d_proc = seq_bits;
let d_dc = d_proc + proc_bits;
let d_timestamp = d_dc + dc_bits;
// 作为时间差计算的基准时间，时间差占39位，该算法id可使用17年，到2037年
let dt: Date = new Date("2020-01-01 00:00:00");

let last_timestamp = 0;

let SEQ_MAX = Math.pow(2, seq_bits);

function get_timestamp() {

}
let set_process_id = function(pid: number){
    process_id = pid;
}
let set_dc_id = function(did: number){
    dc_id = did;
}

let prefix = (process_id<<d_proc) + (dc_id<<d_dc) + (last_timestamp<<d_timestamp);

let new_id = function() {
    let timestamp:number = (new Date()).getTime() - dt.getTime();

    if(timestamp < last_timestamp) {
        if(last_timestamp-timestamp<10) {
            timestamp = last_timestamp;
        } else {
            throw new Error("id generator error.");
        }
    }

    if(timestamp===last_timestamp) {
        max_seq +=1;
    } else {
        last_timestamp = timestamp;
        prefix = (process_id<<d_proc) + (dc_id<<d_dc) + Math.pow(2,d_timestamp) * timestamp;
        //prefix = (process_id<<d_proc) + (dc_id<<d_dc) + (timestamp<<d_timestamp);
        max_seq = 0;
    }
    if(max_seq>=SEQ_MAX) {
        last_timestamp +=1;
        prefix = (process_id<<d_proc) + (dc_id<<d_dc) + Math.pow(2,d_timestamp) * last_timestamp;
        max_seq = 0;
    }
	return prefix + max_seq;
};
export { new_id, set_process_id, set_dc_id };
// exports.new_id = new_id;
// exports.set_process_id = set_process_id;
// exports.set_dc_id = set_dc_id;

