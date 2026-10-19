# v1.3 基博岛靠岸

第一期岛屿机制：建成屋顶灯塔后，海楼出现「发现基博岛 · 靠岸」入口；主动靠岸，不强制打断经营。离开后五分钟可回访，不要求玩家按时上线。故事中途离开、关闭弹窗及重启均保留选择。

基博岛主是虚构的 50 岁岛务负责人，关心岛民、受到爱戴。短寸灰鬓、细框眼镜、深蓝西装，正式姿态持维修清单，俏皮姿态端搪瓷杯低声说话。点击人物切换姿态。第一篇以修复公共澡堂为中心，用双关碎嘴和真实善举表现反差。

三段剧情：欢迎词被岛民打断 → 帮卡在管道里的螃蟹搬家 → 热水恢复、怪饮或合影。每段两个无惩罚选择，不收费，不增设货币。完成后收藏「正经办事」感谢旗，挂于海楼屋顶下，可重看三段结果。当前仅一个岛、一个故事；回访没有新奖励。尚未制作航行过场或可自由走动的岛屿地图。

保存字段 island：docked、choices、visits、nextAt。旧存档缺失字段自动迁移；无效选择、重入靠岸、重复剧情提交会拒绝；时钟回拨保持等待剩余时长。感谢旗由已完成的三段选择推导，不重复发资源。

独立演示：demo-v13.html。正式入口 index.html。截图 screenshots/v13/jibo-chief.png。微信构建 dist/wechat，不自动上传。

## 人物资产生成记录

使用内置 image_gen（imagegen 技能），非 API/CLI。参考：用户所附 AI 写实照片仅取外貌特征；assets/cast-v4.png 作为画风参考。输出 assets/chief-v13.png（透明、左右两个等分姿态），浏览器 assets/webp/chief-v13.webp；微信压缩到 640 像素宽。参考照片临时文件已不存在，生成工具使用会话内可见图片。

Prompt specification: Create a production transparent game sprite atlas with two equal square cells horizontally. Exactly two full-body poses of the same fictional 50-year-old kind but comically mischievous island mayor. Identity cues: short crew cut with graying temples, thin rectangular glasses, broad round face, navy suit, white shirt, dotted tie. Strict style reference: the existing six-character sheet; exaggerated expressive proportions, chunky head, hands and shoes, hand-painted warm textured nautical illustration, strong contours and detailed fabric; not photorealistic or anime. Slightly stocky with belly and aging smile lines. Left: dignified, holding public works clipboard, straight tie, caring smile. Right: leaning forward, impish sideways squint and raised eyebrow, conspiratorial grin, palm beside mouth whispering a cheeky joke, loosened tie, other hand holds enamel tea mug. Harmless comic innuendo, no explicit content. Entire full bodies in separate cells, same scale and baseline, transparent margins, no text, watermark or scenery.
