// Content preserved from v1.3.3; production/progression are tracked separately.
export const SKY_ROOMS = [
  {
    "id": "coffee",
    "name": "阿昊咖啡工作间",
    "floor": 3,
    "art": 0,
    "who": "crewAuthor",
    "cost": {
      "wood": 18,
      "metal": 5,
      "resin": 2
    },
    "seconds": 12,
    "action": "给咖啡打奶泡",
    "intro": "阿昊把电脑搬上三楼：终于有一间房，插座比床位多了。",
    "reply": "噗——奶泡堆成小山！阿昊：这杯叫云端办公。"
  },
  {
    "id": "bath",
    "name": "海景泡泡浴室",
    "floor": 3,
    "art": 1,
    "who": "crewTank",
    "cost": {
      "wood": 16,
      "metal": 6,
      "water": 8
    },
    "seconds": 12,
    "action": "打开海风花洒",
    "intro": "阿桶抱着浴缸上楼：海景房有了，我想泡的水得是淡的。",
    "reply": "花洒一开，泡沫飞上头顶。阿桶：今天的发型叫海草自由。"
  },
  {
    "id": "laundry",
    "name": "水母洗衣房",
    "floor": 4,
    "art": 2,
    "who": "crewWire",
    "cost": {
      "wood": 20,
      "metal": 6,
      "resin": 3
    },
    "seconds": 16,
    "action": "启动水母甩干",
    "intro": "阿线请来水母洗衣工：它负责转圈，我负责认领袜子。",
    "reply": "袜子啪地贴住玻璃！阿线：衣服没丢，只是换了个展示位置。"
  },
  {
    "id": "diner",
    "name": "怪味海鲜餐厅",
    "floor": 4,
    "art": 3,
    "who": "crewBoss",
    "cost": {
      "wood": 22,
      "metal": 5,
      "mortar": 3
    },
    "seconds": 16,
    "action": "揭开今日特餐",
    "intro": "卷姨挂出菜单：今天的菜名，等阿昊尝完再定。",
    "reply": "锅盖一开，饮料咕嘟冒泡。卷姨：这是汤，还是你点的咖啡？"
  },
  {
    "id": "greenhouse",
    "name": "海风玻璃温室",
    "floor": 5,
    "art": 4,
    "who": "crewDiver",
    "cost": {
      "wood": 24,
      "metal": 8,
      "resin": 4
    },
    "seconds": 18,
    "action": "给海藻浇点水",
    "intro": "阿潜把捞来的海藻种进花盆：它应该不会比楼长得快吧？",
    "reply": "海藻探过窗户，跟隔壁打招呼。阿潜：房客没增加，绿化超员了。"
  },
  {
    "id": "hammock",
    "name": "摇摇吊床露台",
    "floor": 5,
    "art": 5,
    "who": "crewTank",
    "cost": {
      "wood": 22,
      "metal": 5,
      "resin": 3
    },
    "seconds": 18,
    "action": "轻轻推一下吊床",
    "intro": "阿桶挂好吊床：从这里躺着看海，应该不算摸鱼。",
    "reply": "吊床晃了一圈，拖鞋先下楼了。阿桶：帮我给一楼带个话！"
  },
  {
    "id": "rooftop",
    "name": "楼顶烧烤营地",
    "floor": 6,
    "art": 6,
    "who": "crewBoss",
    "cost": {
      "wood": 30,
      "metal": 10,
      "mortar": 5,
      "coins": 35
    },
    "seconds": 20,
    "action": "敲响楼顶开饭铃",
    "intro": "灯串亮起，大家各搬一把椅子上楼。六层的海风，配一顿热饭。",
    "reply": "叮——全楼开饭！阿昊带咖啡，阿桶带胃口，卷姨说谁也不许洗碗前溜走。"
  }
];
export const ISLAND_TOYS = {
  "post": {
    "name": "贝壳邮局",
    "lines": [
      "你敲了敲贝壳，弹出一封信：“收件人：昨天的我。请少喝那杯怪饮。”",
      "邮差海鸥把信送回你手里：“同岛快递，快得还没出门。”",
      "新明信片写着：“今天风很大，思念被吹到隔壁岛了。”"
    ]
  },
  "garden": {
    "name": "怪蔬菜小园",
    "lines": [
      "紫甘蓝抖抖叶子，露出一只偷午睡的螃蟹。菜农：“这是会动的有机认证。”",
      "南瓜顶起小草帽，里面传来一声“别浇了，我刚洗完头”。",
      "岛主在菜地插了新牌：禁止比菜还闲。"
    ]
  },
  "well": {
    "name": "回声许愿井",
    "lines": [
      "你向井里喊“发财！”回声答：“先吃饭！”看来井也饿了。",
      "你许愿今晚不加班，井里冒出一个泡泡：“批准。”",
      "你问井里有谁。回声说：“我只是路过的水。”"
    ]
  },
  "drying": {
    "name": "海风晾鱼架",
    "lines": [
      "风把咸鱼吹得齐刷刷翻身。大婶：“看，连鱼都知道换个姿势。”",
      "你轻轻一碰，晾鱼架奏出一声跑调的海风小曲。",
      "有条鱼挂反了。岛主扶正眼镜：“它想看看不同的世界。”"
    ]
  }
};
export const VIGNETTES = [["crewTank","阿桶转了半圈，大家也追着冷风转了半圈。"],["crewWire","阿线对着鱼电话说：信号不好，你先别游。"],["crewBoss","卷姨尝了一口汤：淡了。海风立刻想帮忙。"],["crewTank","阿桶抱着木头路过：这是家具，还是今晚的枕头？"],["crewWire","电鳗打了个嗝，阿线的头发又立起来了。"],["crewBoss","卷姨敲锅开饭，连海鸥都排上了队。"]];
