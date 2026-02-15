/**
 * bcrypt 测试文件
 * 用于验证 bcrypt 的内置盐机制和 verify 方法的使用
 */
import bcrypt from 'bcrypt';

async function demonstrateBcrypt() {
    console.log('=== bcrypt 内置盐机制演示 ===\n');
    
    const password = 'mySecretPassword123';
    const saltRounds = 10;
    
    // 1. 生成多个哈希值，证明每次都不同（因为内置了随机盐）
    console.log('1. 相同密码多次哈希的结果：');
    for (let i = 1; i <= 3; i++) {
        const hash = await bcrypt.hash(password, saltRounds);
        console.log(`   哈希 ${i}: ${hash}`);
    }
    console.log('   注意：每次哈希结果都不同，因为 bcrypt 内置了随机盐\n');
    
    // 2. 生成一个哈希值用于验证测试
    const hash = await bcrypt.hash(password, saltRounds);
    console.log(`2. 生成的哈希值: ${hash}\n`);
    
    // 3. 验证密码（正确密码）
    const isValid1 = await bcrypt.compare(password, hash);
    console.log(`3. 验证正确密码: ${isValid1} (应该是 true)\n`);
    
    // 4. 验证密码（错误密码）
    const wrongPassword = 'wrongPassword';
    const isValid2 = await bcrypt.compare(wrongPassword, hash);
    console.log(`4. 验证错误密码: ${isValid2} (应该是 false)\n`);
    
    // 5. 分析哈希值结构
    console.log('5. bcrypt 哈希值结构分析：');
    console.log(`   完整哈希: ${hash}`);
    
    // bcrypt 哈希值格式: $2b$rounds$salt+hash
    const parts = hash.split('$');
    if (parts.length >= 4) {
        console.log(`   算法版本: $${parts[1]}$`);
        console.log(`   轮次(cost): ${parts[2]}`);
        console.log(`   盐+哈希: ${parts[3]}`);
        
        // 盐是前22个字符，哈希是后面的字符
        const saltAndHash = parts[3];
        const salt = saltAndHash.substring(0, 22);
        const hashPart = saltAndHash.substring(22);
        console.log(`   盐部分: ${salt}`);
        console.log(`   哈希部分: ${hashPart}`);
    }
    console.log('   这就是为什么 verify 不需要单独的 saltRounds 参数\n');
    
    // 6. 证明不同的 saltRounds 会产生不同的哈希
    console.log('6. 不同 saltRounds 的影响：');
    const rounds = [8, 10, 12];
    for (const round of rounds) {
        const start = Date.now();
        const hashWithRound = await bcrypt.hash(password, round);
        const end = Date.now();
        console.log(`   saltRounds=${round}: ${hashWithRound} (耗时: ${end - start}ms)`);
    }
    console.log('   注意：轮次越高，安全性越高，但计算时间也越长\n');
    
    // 7. 证明旧哈希值仍然可以验证（即使用不同的 saltRounds）
    console.log('7. 向后兼容性测试：');
    const oldHash = await bcrypt.hash(password, 8);  // 较低的轮次
    const newHash = await bcrypt.hash(password, 12); // 较高的轮次
    
    console.log(`   旧哈希 (rounds=8): ${oldHash}`);
    console.log(`   新哈希 (rounds=12): ${newHash}`);
    
    // 验证相同密码对两个不同轮次的哈希都有效
    const validOld = await bcrypt.compare(password, oldHash);
    const validNew = await bcrypt.compare(password, newHash);
    
    console.log(`   验证旧哈希: ${validOld} (应该是 true)`);
    console.log(`   验证新哈希: ${validNew} (应该是 true)`);
    console.log('   结论：bcrypt.compare() 能正确处理不同轮次的哈希值\n');
}

// 执行演示
demonstrateBcrypt().catch(console.error);
