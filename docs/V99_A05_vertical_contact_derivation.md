# V99 · A05→玻片→PDMS竖向接触反解

完全下降的候选转移位姿要求：
PDMS_bottom = sampleChipTop = 110.6 mm

模型关系：
PDMS_bottom = bracketTop - legLength + glassCenterAboveLegBottom - pdmsCenterBelowGlassCenter - pdmsThickness/2

代入：
- bracketTop = 199.5 mm
- glassCenterAboveLegBottom = 1.0 mm
- pdmsCenterBelowGlassCenter = 1.4 mm
- pdmsThickness = 1.8 mm
- sampleChipTop = 110.6 mm

得到：
legLength = 199.5 + 1.0 - 1.4 - 0.9 - 110.6 = 87.6 mm

因此87.6 mm是接触约束解，不是实测加工尺寸；它还依赖1.0、1.4、1.8 mm这些候选局部尺寸。

V99输出：
- lLegLengthSolvedFromNominalContact=true
- lLegLengthPhotoMeasured=false
- a05VerticalContactConstraintSolved=true
- a05VerticalContactPhysicallyValidated=false

要升级为制造尺寸，仍需A05折腿尺图、玻片夹持高度、PDMS实际厚度/偏置及A07W真实顶面高度。