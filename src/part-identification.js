// A catalog match alone does not confirm what is installed on the photographed rig.
const confirmed=new Set(['A03','A04','A08','A11','A12','A13','A16','A34',
  'B02','B04','B06','B08','B09','B21','B24','B30','B31']);
const makerOnly={
  A09:'照片 78 可读 DAHENG IMAGING，完整型号未读出。',
  A15:'实拍与原厂资料支持大恒 GCM-T25M 系列，2L／2C 后缀待核。',
  B03:'照片 109 可读 DHC 和 GCM-T25M，2L／2C 后缀待核。',
  B16:'照片 116 可读 SDPTOP 和 MXFMS，具体版本待核。',
  B17:'照片 113 可读 SDPTOP 相机标识，完整型号未读出。',
  B19:'照片 114 可读 YUDIAN。面板匹配 AI-719／719P 系列，完整订货型号待核。',
  B34:'原视频约28–32秒可读 Zolix，完整型号未读出，PHSH-2 为候选。',
  B35:'实拍可读 Thorlabs 标识，MB2530/M 仍是孔系候选。'
};
const modelOnly={
  B20:'照片 123 可读 VN-50，制造商全称待核。',
  B22:'照片 115 可读 D1000，厂商未标示。'
};
const partial={
  A19:'两支物镜可辨 JH-TOP 和 Olympus 品牌。转换盘的厂家、型号及物镜完整型号均待核。',
  B18:'照片 147 确认 SUNNY LMPlan 50×／0.55 WD7.9。另一支仅确认 OptoSigma 品牌，疑似 5× 的物镜及整组其余型号待核。'
};
const evidenceNotes={
  A34:'照片 82 可读 Thorlabs 和 SM1CP2，标记归端盖。',
  A35:'C4W/C6W 为外观及接口候选，方盒本体与对侧杆孔待核。',
  B08:'照片 111 可读转台侧壁的 Daheng GCM-1107M 标记。',
  B33:'PHCP-1 为外形候选，照片未见铭牌。'
};

export const identificationLabels={
  confirmed:'厂家和型号均确认',
  incomplete:'尚未完整确认',
  maker:'仅厂家确认',
  model:'仅型号确认',
  partial:'部分子件确认',
  pending:'厂家和型号均待确认',
  interface:'接口记录',
};

export function identifyPart(part,{makerEdited=false,modelEdited=false}={}){
  if(part.qty===0)return {status:'interface',maker:false,model:false,note:''};
  const evidence=makerOnly[part.id]??modelOnly[part.id];
  const both=confirmed.has(part.id);
  const maker=!makerEdited&&(both||Boolean(makerOnly[part.id]));
  const model=!modelEdited&&(both||Boolean(modelOnly[part.id]));
  const changed=makerEdited||modelEdited;
  const partialNote=partial[part.id];
  const note=changed?'已修改的厂家或型号待复核。':
    evidence??partialNote??evidenceNotes[part.id]??'';
  const status=maker&&model?'confirmed':maker?'maker':model?'model':
    partialNote&&!changed?'partial':'pending';
  return {status,maker,model,note};
}

export function summarizeIdentification(parts){
  const counts={confirmed:0,incomplete:0,maker:0,model:0,partial:0,pending:0,interface:0};
  for(const part of parts){
    const {status}=part.identification;
    counts[status]++;
    if(status!=='confirmed'&&status!=='interface')counts.incomplete++;
  }
  return counts;
}
