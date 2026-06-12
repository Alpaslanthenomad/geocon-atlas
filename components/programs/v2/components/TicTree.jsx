// components/TicTree.jsx
//
// Renders a tic tree. A group node (child_logic 'all' = AND, 'any' = OR) shows an
// OR/AND badge and its DERIVED status (effective_done from the engine); its children
// are indented under it. A leaf node renders a normal TicCard with its actions.
// Completing a leaf refetches, which re-derives the parent group's status.

import TicCard from './TicCard';
import { pickLabel } from '../lib/i18n';

export default function TicTree({
  node, childrenOf, depth = 0, isOwner, members = {}, commentCounts = {}, lang = 'tr',
  onComplete, onWaive, onRevisit, onAssign, onSetStatus,
}) {
  const isGroup = !!node.child_logic;
  const indent = depth > 0 ? { marginLeft: depth === 1 ? 0 : 8 } : undefined;

  if (!isGroup) {
    return (
      <div style={indent}>
        <TicCard
          tic={node}
          isOwner={isOwner}
          members={members}
          commentCount={commentCounts?.[node.tic_id] || 0}
          lang={lang}
          onComplete={onComplete}
          onWaive={onWaive}
          onRevisit={onRevisit}
          onAssign={onAssign}
          onSetStatus={onSetStatus}
        />
      </div>
    );
  }

  const kids = childrenOf[node.tic_id] || [];
  const done = !!node.effective_done;
  const label = pickLabel(node, lang);
  const badge = node.child_logic === 'any'
    ? { tr: 'herhangi biri', en: 'any one', cls: 'text-teal-700 bg-teal-50 border-teal-200' }
    : { tr: 'tümü', en: 'all', cls: 'text-amber-700 bg-amber-50 border-amber-200' };

  return (
    <div style={indent}>
      <div className="flex items-center gap-2 py-1.5">
        <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold ${
          done ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'
        }`}>
          {done ? '✓' : '○'}
        </span>
        <span className="text-sm font-semibold text-slate-800">{label}</span>
        <span className={`text-[10px] uppercase font-semibold border px-1.5 py-0.5 rounded ${badge.cls}`}>
          {lang === 'tr' ? badge.tr : badge.en}
        </span>
      </div>
      <div className="border-l border-slate-200 pl-3 ml-2.5 space-y-2">
        {kids.map((k) => (
          <TicTree
            key={k.tic_id}
            node={k}
            childrenOf={childrenOf}
            depth={depth + 1}
            isOwner={isOwner}
            members={members}
            commentCounts={commentCounts}
            lang={lang}
            onComplete={onComplete}
            onWaive={onWaive}
            onRevisit={onRevisit}
            onAssign={onAssign}
            onSetStatus={onSetStatus}
          />
        ))}
      </div>
    </div>
  );
}
