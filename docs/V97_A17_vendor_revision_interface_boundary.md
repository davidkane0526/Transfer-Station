# V97 · A17 厂家规格修订与接口边界

Oeabt当前MBS-65产品页对MBS-65B/C给出65.2×65.2×20 mm与132 N（13.5 kgf）保持力；2024/2025官方目录则给出158 N（16 kgf）。项目同时保留两组数值并标记厂家版本冲突，在没有产品修订号或批次信息前不用于载荷安全设计。

MBS-65B候选孔阵为9-M6+4-M4，MBS-65C为1-M6+12-M4。虽然Daheng GCM-901604M标准组合图可见M6等孔系，但它描述的是厂家标准组合连接面，不能证明用户实机A15底面，更不能证明被A15完全遮住的A17顶面。因此：
- A15 bottom mount pattern verified = false
- GCM-901604 4-M6 cannot prove A15-to-A17 interface = true
- MBS-65B vs C mechanical discrimination closed = false

要闭合B/C后缀，仍需A17顶面孔阵、可读铭牌、A15拆下后的底面孔系，或采购记录中的具体型号。
