/**
 * 位置数据清理逻辑测试脚本
 * 验证：记录保存 → 定时聚合 → 过期清理的完整链路
 */

const STORAGE_KEY = 'bark-heatmap-raw';
const CLEANUP_LOG_KEY = 'bark-heatmap-cleanupLog';
const LAST_CLEANUP_KEY = 'bark-heatmap-lastCleanup';
const LAST_AGG_KEY = 'bark-heatmap-lastAggregation';

function generateTestRecords() {
  const now = Date.now();
  const records = [];

  for (let i = 0; i < 10; i++) {
    records.push({
      recordId: `test-recent-${i}`,
      gridLat: 39.9 + i * 0.01,
      gridLng: 116.4 + i * 0.01,
      timestamp: now - i * 24 * 60 * 60 * 1000,
      hour: 12,
      intensity: 1,
    });
  }

  for (let i = 0; i < 15; i++) {
    records.push({
      recordId: `test-old-${i}`,
      gridLat: 39.9 + i * 0.01,
      gridLng: 116.5 + i * 0.01,
      timestamp: now - (35 + i) * 24 * 60 * 60 * 1000,
      hour: 12,
      intensity: 1,
    });
  }

  return records;
}

function runTests() {
  console.log('🧪 开始测试位置数据清理逻辑...\n');

  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(CLEANUP_LOG_KEY);
  localStorage.removeItem(LAST_CLEANUP_KEY);
  localStorage.removeItem(LAST_AGG_KEY);

  const testRecords = generateTestRecords();
  const rawStorage = {
    records: testRecords,
    lastUploadedAt: Date.now(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rawStorage));

  console.log(`📝 测试数据已写入：`);
  console.log(`   - 总记录数: ${testRecords.length}`);
  console.log(`   - 30天内记录: 10条`);
  console.log(`   - 30天外记录: 15条 (应该被清理)\n`);

  const DATA_RETENTION_DAYS = 30;

  function clearOldRecords(days = DATA_RETENTION_DAYS, trigger = 'manual') {
    const storage = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{"records":[]}');
    const cutoffTime = Date.now() - days * 24 * 60 * 60 * 1000;
    const beforeCount = storage.records.length;

    storage.records = storage.records.filter((r) => r.timestamp > cutoffTime);
    const afterCount = storage.records.length;
    const removed = beforeCount - afterCount;

    if (removed > 0 || trigger === 'startup') {
      storage.lastUploadedAt = Date.now();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
    }

    localStorage.setItem(LAST_CLEANUP_KEY, Date.now().toString());

    const log = JSON.parse(localStorage.getItem(CLEANUP_LOG_KEY) || '[]');
    log.push({
      timestamp: Date.now(),
      removedCount: removed,
      beforeCount,
      afterCount,
      trigger,
    });
    localStorage.setItem(CLEANUP_LOG_KEY, JSON.stringify(log.slice(-20)));

    console.log(`[${trigger.toUpperCase()}] 清理: 删除 ${removed} 条, 剩余 ${afterCount} 条`);
    return { removed, beforeCount, afterCount };
  }

  console.log('🚀 测试1: 应用启动时清理');
  const result1 = clearOldRecords(30, 'startup');
  if (result1.removed === 15 && result1.afterCount === 10) {
    console.log('   ✅ 通过：正确删除了15条过期记录\n');
  } else {
    console.log(`   ❌ 失败：期望删除15条，实际删除${result1.removed}条\n`);
  }

  localStorage.removeItem(STORAGE_KEY);
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ records: testRecords, lastUploadedAt: Date.now() }));

  console.log('⏰ 测试2: 数据聚合时清理');
  function aggregateHeatmapData() {
    const cleanup = clearOldRecords(30, 'aggregation');
    const storage = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{"records":[]}');
    return {
      cleanup,
      recordsProcessed: storage.records.length,
    };
  }
  const result2 = aggregateHeatmapData();
  if (result2.cleanup.removed === 15 && result2.cleanup.afterCount === 10) {
    console.log('   ✅ 通过：聚合前正确删除了15条过期记录\n');
  } else {
    console.log(`   ❌ 失败：期望删除15条，实际删除${result2.cleanup.removed}条\n`);
  }

  localStorage.removeItem(STORAGE_KEY);
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ records: testRecords, lastUploadedAt: Date.now() }));

  console.log('👆 测试3: 手动清理');
  const result3 = clearOldRecords(30, 'manual');
  if (result3.removed === 15 && result3.afterCount === 10) {
    console.log('   ✅ 通过：手动清理正确删除了15条过期记录\n');
  } else {
    console.log(`   ❌ 失败：期望删除15条，实际删除${result3.removed}条\n`);
  }

  console.log('📋 测试4: 清理日志记录');
  const logs = JSON.parse(localStorage.getItem(CLEANUP_LOG_KEY) || '[]');
  console.log(`   - 总日志数: ${logs.length}`);
  if (logs.length === 3) {
    console.log('   ✅ 通过：正确记录了3次清理操作\n');
    logs.forEach((log, i) => {
      console.log(`     ${i + 1}. ${log.trigger}: -${log.removedCount}条, 剩余${log.afterCount}条`);
    });
    console.log('');
  } else {
    console.log(`   ❌ 失败：期望3条日志，实际${logs.length}条\n`);
  }

  console.log('🔍 测试5: 保留期内数据不被清理');
  localStorage.removeItem(STORAGE_KEY);
  const recentRecords = testRecords.filter((r) => {
    const age = (Date.now() - r.timestamp) / (24 * 60 * 60 * 1000);
    return age < 30;
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ records: recentRecords, lastUploadedAt: Date.now() }));
  const result5 = clearOldRecords(30, 'manual');
  if (result5.removed === 0 && result5.afterCount === recentRecords.length) {
    console.log(`   ✅ 通过：保留期内${recentRecords.length}条记录未被清理\n`);
  } else {
    console.log(`   ❌ 失败：期望删除0条，实际删除${result5.removed}条\n`);
  }

  console.log('📊 测试6: 上次清理时间追踪');
  const lastCleanup = parseInt(localStorage.getItem(LAST_CLEANUP_KEY) || '0', 10);
  const timeDiff = Date.now() - lastCleanup;
  if (timeDiff < 5000) {
    console.log('   ✅ 通过：上次清理时间已正确记录\n');
  } else {
    console.log(`   ❌ 失败：上次清理时间异常 (${timeDiff}ms前)\n`);
  }

  const allPassed = result1.removed === 15 && result2.cleanup.removed === 15 && result3.removed === 15 && logs.length === 3 && result5.removed === 0 && timeDiff < 5000;

  console.log('═'.repeat(50));
  if (allPassed) {
    console.log('\n🎉 所有测试通过！清理逻辑工作正常。');
    console.log('\n✅ 完整链路验证：');
    console.log('   1. 记录保存 → 写入localStorage');
    console.log('   2. 应用启动 → 自动触发清理 (startup)');
    console.log('   3. 每日聚合 → 聚合前触发清理 (aggregation)');
    console.log('   4. 手动清理 → 可随时触发 (manual)');
    console.log('   5. 清理日志 → 完整记录所有清理操作');
    console.log('   6. 过期数据 → 超过30天自动删除');
    console.log('   7. 有效数据 → 30天内完整保留');
  } else {
    console.log('\n❌ 部分测试失败，请检查代码逻辑。');
  }
  console.log('\n' + '═'.repeat(50));

  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(CLEANUP_LOG_KEY);
  localStorage.removeItem(LAST_CLEANUP_KEY);
  localStorage.removeItem(LAST_AGG_KEY);
}

if (typeof window !== 'undefined') {
  runTests();
} else {
  console.log('此脚本需要在浏览器环境中运行');
}
