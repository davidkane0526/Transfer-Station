// V38: installation topology; A/B denote two photographed rigs, NOT two
// simultaneously stacked/duplicated base boards on one rig.
// Support plates / instrument feet are not a second optical breadboard.
export const MOUNT_RULES=Object.freeze({
 A:{
   commonBase:'A01',
   installedMagnet:'A17',
   magnetic:['A17','A15'],
   bolted:['A16','A06','A02','A07','A10'],
   separate:['A12','A13'],
   accessoryBoards:[],
   verifiedAnchorHoleCoordinates:false
 },
 B:{
   commonBase:'B01',
   installedMagnet:'B02',
   magnetic:['B02','B03','B04','B05','B06','B07'],
   bolted:['B35','B08','B09','B10','B11','B16'],
   separate:['B19','B20','B21','B22','B23','B36','B39'],
   accessoryBoards:['B35'],
   verifiedAnchorHoleCoordinates:false
 }
});
export function mountStatus(platform,id){
 const m=MOUNT_RULES[platform];
 if(!m)return {kind:'unknown',text:'装配规则未知',verified:false};
 if(id===m.commonBase)return {kind:'base',text:'本装置唯一公共光学面包板',verified:true};
 if(m.accessoryBoards.includes(id))return {
    kind:'accessory',text:'螺钉固定在公共面包板上的局部安装板（不是第二块公共底座）',
    verified:false
 };
 if(m.magnetic.includes(id))return {
    kind:'magnetic',text:'载玻片侧经磁性底座固定于面包板（磁力/锁紧工况待核）',
    verified:id===m.installedMagnet
 };
 if(m.bolted.includes(id))return {
    kind:'bolted',text:'经螺钉/中间安装件连接到面包板（孔位及牙长待核）',
    verified:false
 };
 if(m.separate.includes(id))return {
    kind:'separate',text:'独立外部设备，不固定在面包板上的样品机构',
    verified:true
 };
 return {kind:'inherited',text:'通过相邻结构件装配；底层固定关系见主机构',verified:false};
}
export function auditBaseTopology(platform){
 const m=MOUNT_RULES[platform];
 if(!m)throw Error('Unknown rig '+platform);
 if(m.commonBase===m.installedMagnet||
    m.accessoryBoards.includes(m.commonBase)||
    m.bolted.includes(m.commonBase)||
    m.magnetic.includes(m.commonBase))
    throw Error('Common base must be unique');
 return Object.freeze({
   platform,commonBreadboardCount:1,
   commonBase:m.commonBase,
   magneticBase:m.installedMagnet,
   accessoryBoardCount:m.accessoryBoards.length,
   accessoryBoards:[...m.accessoryBoards],
   photoRigIndependentFromOtherRig:true,
   magneticallyMountedStageId:platform==='A'?'A15':'B03',
   manufacturerAnchorsAllVerified:false
 });
}
