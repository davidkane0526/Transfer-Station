// Engineering assembly display constraints (not as-built manufacturing data).
// Three.js uses Y as height. The film stage manufacturer's two horizontal
// axes correspond to scene X and scene Z, NOT scene Y (height).
export const AXES={
 B03:{makerAxes:['X','Y'],sceneAxes:['X','Z'],linear:2,micrometers:2,verified:'photo-and-maker-drawing'},
 B09:{makerAxes:['X'],sceneAxes:['X'],linear:1,micrometers:1,verified:'OEM-official'},
 B08:{makerAxes:['theta'],sceneAxes:['yaw'],linear:0,micrometers:0,verified:'maker-and-photo'},
 A15:{makerAxes:['X','Y'],sceneAxes:['X','Z'],linear:2,micrometers:2,verified:'photo-and-maker-drawing'},
 A02:{makerAxes:['X'],sceneAxes:['X'],linear:1,micrometers:1,verified:'proxy-only-subtype-unknown'}
};
export const JOINTS={
 B02:{count:4,kind:'mounting-head-proxy',status:'candidate',name:'磁座至双轴台（固定孔/螺纹未配准）'},
 B03:{count:4,kind:'mounting-head-proxy',status:'candidate',name:'双轴台顶部预留紧固件（会被上层遮挡）'},
 B04:{count:4,kind:'mounting-head-proxy',status:'candidate',name:'竖直台安装底板'},
 B30:{count:4,kind:'mounting-head-proxy',status:'candidate',name:'照片97 VC13M底部法兰'},
 B31:{count:2,kind:'mounting-head-proxy',status:'candidate',name:'照片94 G40M60L安装台面'},
 B05:{count:4,kind:'mounting-head-proxy',status:'candidate',name:'直线悬臂底座紧固件'},
 B06:{count:2,kind:'jaw-clamp-proxy',status:'candidate',name:'玻片夹爪夹紧螺钉'},
 B08:{count:4,kind:'mounting-head-proxy',status:'candidate',name:'旋转台上部连接参考'},
 B09:{count:4,kind:'mounting-head-proxy',status:'candidate',name:'NFP 底座到旋转台（固定侧）'},
 B14:{count:4,kind:'flush-cap-head',status:'count-and-flush-user-confirmed',name:'金属块顶面四枚齐平螺钉；型号和孔距未知'},
 B16:{count:4,kind:'mounting-head-proxy',status:'candidate',name:'显微镜底座四角紧固件'},
 A02:{count:4,kind:'mounting-head-proxy',status:'candidate',name:'样品平移台顶面候选连接'},
 A03:{count:4,kind:'mounting-head-proxy',status:'candidate',name:'竖直台安装法兰'},
 A04L:{count:2,kind:'mounting-head-proxy',status:'candidate',name:'A照片94下层独立摆角台安装'},
 A04:{count:2,kind:'mounting-head-proxy',status:'candidate',name:'摆角台安装'},
 A06:{count:4,kind:'mounting-head-proxy',status:'candidate',name:'A 样品旋转台安装'},
 A07:{count:4,kind:'mounting-head-proxy',status:'candidate',name:'A 样品加热座'},
 A10:{count:4,kind:'mounting-head-proxy',status:'candidate',name:'A 显微镜支架'},
 A16:{count:4,kind:'mounting-head-proxy',status:'candidate',name:'A GCM-5306M支承板四枚安装螺钉位置候选'},
 A15:{count:4,kind:'mounting-head-proxy',status:'candidate',name:'A 载玻片双轴台'}
};
// A single cantilever runs laterally from the V25M output flange toward
// the independent glass clamp. This replaces the earlier unsupported loop
// made of an 85mm riser, 249mm rear rail and two hanging rods.
// Optical-axis exclusion for the *displayed* assembly. It does not verify
// a real OEM fixture: the bracket dimensions and jaw grip remain candidates.
// The original rod crossed the sampleX optical axis and hid the substrate.
// Here the film is clamped at its LEFT edge, so only transparent glass
// continues over the specimen. +Y is height, +X is toward the specimen.
export function filmCantileverB({
 armX,sampleX,glassClampXOffset=-42,baseY=135,clampTopY=128,
 rodCenterY=20,glassCenterXOffset=5,glassWidth=76,objectiveRadius=17
}){
 const clampWorldX=sampleX+glassClampXOffset;
 const xReach=clampWorldX-armX;
 if(!(xReach>80 && xReach<350))throw new Error('Unexpected film-side rod span');
 if(!(Math.abs(baseY-clampTopY)<40))throw new Error('Unexpected mounting height');
 // 22 mm jaw reaches to the right after the GCM clamp is installed yaw=180.
 const glassLeftEdgeX=sampleX+glassCenterXOffset-glassWidth/2;
 const jawEndX=clampWorldX+21;
 const opticalLeftLimitX=sampleX-objectiveRadius;
 if(!(jawEndX>glassLeftEdgeX && jawEndX<opticalLeftLimitX))
   throw new Error('Jaw fails to grip glass or crosses objective optical keep-out');
 if(!(clampWorldX+17<opticalLeftLimitX))
   throw new Error('Glass clamp body crosses objective optical keep-out');
 const rodStartX=12,rodEndX=xReach;
 const rodLength=rodEndX-rodStartX;
 const oemRodLengthMm=150,hiddenInsertionMm=oemRodLengthMm-rodLength;
 if(hiddenInsertionMm<0||hiddenInsertionMm>25)throw new Error('OEM PHSP12-5 rod length is incompatible with selected span');
 const terminalBottomLocalY=clampTopY-baseY;
 const terminalHeight=rodCenterY-terminalBottomLocalY;
 if(terminalHeight<=0)throw new Error('Cantilever terminal must meet top of slide clamp');
 return {rodStartX,rodEndX,rodLength,rodCenterX:(rodStartX+rodEndX)/2,
   rodCenterY,rodZ:0,oemRodLengthMm,hiddenInsertionMm,terminalBottomLocalY,terminalHeight,
   terminalCenterY:(rodCenterY+terminalBottomLocalY)/2,
   clampWorldX,glassLeftEdgeX,jawEndX,opticalLeftLimitX,
   mountY:baseY,clampTopY,
   photos:'107/108; dimensions and exact holder subtype still candidate',
   physicalJointAccepted:false,loopBack:false,verticalFreeRods:0,
   opticalAxisTraversed:false};
}
