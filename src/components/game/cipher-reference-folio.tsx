"use client";

import { BookOpen, Clock3, Hash, RadioTower, Route } from "lucide-react";
import { a1z26Rows, getCipherReference, morseRows, type CipherReferenceKind } from "@/src/content/cipher-references";

const iconByKind: Record<CipherReferenceKind, typeof BookOpen> = {
  clock: Clock3,
  a1z26: Hash,
  chronology: Route,
  frequency: RadioTower,
  arithmetic: Hash,
  morse: RadioTower,
  "causal-chain": Route,
  continuity: BookOpen,
};

export function CipherReferenceFolio({ challengeId }: { challengeId: string }) {
  const reference = getCipherReference(challengeId);
  if (!reference) return null;
  const Icon = iconByKind[reference.kind];
  const rows = reference.kind === "a1z26" ? a1z26Rows : reference.kind === "morse" ? morseRows : [];

  return <details className="cipher-reference-folio">
    <summary><Icon /><span><small>DESK REFERENCE · {reference.label}</small><b>{reference.title}</b></span></summary>
    <div>
      <p>{reference.description}</p>
      {rows.length > 0 && <code>{rows.map((row) => <span key={row}>{row}</span>)}</code>}
      {reference.kind === "clock" && <code><span>00:00–23:59</span><span>HH : MM = 小时 : 分钟</span></code>}
      {reference.kind === "chronology" && <ol><li>确定统一排序轴</li><li>按轴重排全部片段</li><li>读取每项附带字符或字段</li></ol>}
      {reference.kind === "frequency" && <ol><li>确认单位与允许精度</li><li>放置小数点</li><li>核对每一位来源</li></ol>}
      {reference.kind === "arithmetic" && <ol><li>标出总数与重复项</li><li>先消除重复记录</li><li>再按每组数量换算</li></ol>}
      {reference.kind === "causal-chain" && <ol><li>找最先变化的证物</li><li>沿箭头追踪影响</li><li>区分起点与被指控对象</li></ol>}
      {reference.kind === "continuity" && <ol><li>路线证明抵达</li><li>住所证明持续</li><li>日常义务证明独立生活</li></ol>}
      <small>参考册只提供通用方法，不会代填答案，也不会记录是否打开。</small>
    </div>
  </details>;
}
