# V98 · 平台 A 工作位原点反解与证据边界

当前局部几何给出A05折边基准 -58.75 mm、玻片近端 -92.75 mm；76 mm玻片上8 mm PDMS距远端4 mm，因此PDMS中心局部X=-160.75 mm。整条膜侧机构刚体旋转180°后，PDMS世界X=filmStageX-localStampX。令其命中A07候选样品中心X=78 mm，得到 filmStageX=-82.75 mm。

因此-82.75 mm是接触目标约束的解，不是照片注册或尺图实测值。V98把上述推导变为代码本身，并加入：
- filmStageXSolvedFromNominalPdmsTarget=true
- filmStageXPhotoMeasured=false
- filmStageXPhotoRegistered=false
- localStampXBeforeYawMm=-160.75
- nominalStampTargetXmm=78

仍需独立证据才能闭合全局安装原点：同图带尺看到两支路基准、面包板孔阵共同配准、直接测量中心距，或完整摄影测量。