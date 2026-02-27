const fs = require('fs');

const bentoGrid = `
      {/* 
          BENTO GRID
           */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mt-6 mb-20 auto-rows-max">

        {/* --- ROW 1: Greeting & Main Stats --- */}
        <div className="xl:col-span-2 bg-[var(--notion-bg-secondary)] border border-[var(--notion-border)] rounded-[var(--radius-md)] p-8 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-4 right-4 flex items-center gap-2 text-[var(--notion-text-muted)]">
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--brand-cyan)] animate-pulse" style={{ boxShadow: "0 0 10px var(--brand-cyan-glow)" }} />
            <span className="text-[10px] font-mono tracking-widest uppercase">{timeStr}</span>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[var(--notion-text-secondary)] mb-2 mt-4">
              {greeting}
            </p>
            <h1 className="text-4xl font-extralight tracking-tight text-[var(--notion-text)] mb-6">
              {session?.user?.name || "Commander"}
            </h1>
            <BadgeCollection badges={USER_BADGES} />
          </div>
        </div>

        {/* Tasks Stat Tile */}
        <Link href="/dashboard/tasks" style={{ textDecoration: 'none' }} className="bg-[var(--notion-bg-secondary)] border border-[var(--notion-border)] rounded-[var(--radius-md)] p-6 hover:border-[var(--notion-text-muted)] hover:-translate-y-[1px] transition-all duration-300 group flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[var(--brand-orange)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex justify-between items-start mb-6">
            <CheckSquare size={16} className="text-[var(--brand-orange)]" />
            <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-[var(--notion-text-muted)]" />
          </div>
          <div>
            <div className="text-4xl font-extralight text-[var(--notion-text)] mb-2">{loading ? "-" : stats?.activeTasks || 0}</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--notion-text-muted)] font-bold">Active Tasks</div>
          </div>
        </Link>

        {/* Messages Stat Tile */}
        <Link href="/dashboard/messages" style={{ textDecoration: 'none' }} className="bg-[var(--notion-bg-secondary)] border border-[var(--notion-border)] rounded-[var(--radius-md)] p-6 hover:border-[var(--notion-text-muted)] hover:-translate-y-[1px] transition-all duration-300 group flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[var(--brand-cyan)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex justify-between items-start mb-6">
            <MessageSquare size={16} className="text-[var(--brand-cyan)]" />
            <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-[var(--notion-text-muted)]" />
          </div>
          <div>
            <div className="text-4xl font-extralight text-[var(--notion-text)] mb-2">{loading ? "-" : stats?.unreadMessages || 0}</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--notion-text-muted)] font-bold">Unread Msgs</div>
          </div>
        </Link>

        {/* AI Insights Full Width Tile */}
        <div className="xl:col-span-4">
          <AIInsights />
        </div>

        {/* --- ROW 2: Widgets (Dynamic) spanning cols --- */}
        {orderedWidgets.map((widget) => {
          const spanClass = widget.span === 2 ? "md:col-span-2 xl:col-span-2" : "col-span-1";
          return (
            <div
              key={widget.id}
              draggable
              onDragStart={(e) => handleDragStart(e, widget.id)}
              onDragOver={(e) => handleDragOver(e, widget.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, widget.id)}
              onDragEnd={handleDragEnd}
              className={\`relative bg-[var(--notion-bg-secondary)] border border-[var(--notion-border)] rounded-[var(--radius-md)] overflow-hidden transition-all duration-300 \${spanClass} \${draggedId === widget.id ? "opacity-20 scale-[0.97]" : "opacity-100"} \${dragOverId === widget.id ? "ring-1 ring-[var(--brand-cyan)]" : ""}\`}
            >
              <div className="absolute top-4 right-4 z-20 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center p-1 bg-[var(--notion-bg-tertiary)] rounded border border-[var(--notion-border)] cursor-grab text-[var(--notion-text-muted)]">
                <GripVertical size={12} />
              </div>
              <widget.component />
            </div>
          );
        })}

        {/* --- ROW 3: Operations --- */}
        <div className="xl:col-span-2 bg-[var(--notion-bg-secondary)] border border-[var(--notion-border)] rounded-[var(--radius-md)] overflow-hidden flex flex-col h-[320px]">
          <div className="flex items-center justify-between p-5 border-b border-[var(--notion-border)] bg-[var(--notion-bg-secondary)] z-10">
            <div className="flex items-center gap-3">
              <Zap size={14} className="text-[var(--brand-orange)]" />
              <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[var(--notion-text-secondary)]">Action Queue</span>
              {myTasks.length > 0 && <span className="text-[9px] font-mono text-[var(--brand-orange)] bg-[var(--brand-orange)]/10 px-1.5 py-0.5 rounded">{myTasks.length} pending</span>}
            </div>
            <Link href="/dashboard/tasks" style={{ textDecoration: 'none' }} className="group/link flex items-center gap-1">
              <span className="text-[9px] uppercase tracking-[0.2em] text-[var(--notion-text-muted)] group-hover/link:text-[var(--brand-orange)] transition-colors">View All</span>
            </Link>
          </div>
          <div className="overflow-y-auto flex-1 p-2">
            {myTasks.length > 0 ? (
              myTasks.map((task) => (
                <TaskHoverPreview
                  key={task.id}
                  task={{
                    title: task.title,
                    status: task.status,
                    priority: task.priority,
                    dueDate: task.dueDate ? new Date(task.dueDate).toLocaleDateString() : undefined,
                  }}
                >
                  <Link href="/dashboard/tasks" style={{ textDecoration: "none" }} className="block group/t">
                    <div
                      className="relative flex items-center gap-3 px-4 py-3 mx-2 my-1 rounded-md transition-all duration-200 hover:bg-[var(--notion-bg-tertiary)] border border-transparent hover:border-[var(--notion-border)]"
                    >
                      <div
                        className="w-1 h-3 rounded-full shrink-0"
                        style={{ background: priorityColor(task.priority) }}
                      />
                      <CheckSquare
                        size={14}
                        className="shrink-0 transition-colors group-hover/t:text-[var(--brand-orange)]"
                        style={{ color: "var(--notion-text-muted)" }}
                      />
                      <span
                        className="flex-1 text-[12px] font-medium tracking-wide truncate"
                        style={{ color: "var(--notion-text)" }}
                      >
                        {task.title}
                      </span>
                      <Badge
                        variant={statusColors[task.status] || "default"}
                        size="sm"
                        className="font-mono text-[9px] tracking-[0.1em] uppercase shrink-0 bg-transparent border border-[var(--notion-border)]"
                      >
                        {statusLabel(task.status)}
                      </Badge>
                    </div>
                  </Link>
                </TaskHoverPreview>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-[var(--notion-text-muted)]">
                <CheckSquare size={18} strokeWidth={1.5} />
                <span className="text-[10px] tracking-widest uppercase">No pending tasks</span>
              </div>
            )}
          </div>
        </div>

        <div className="xl:col-span-2 bg-[var(--notion-bg-secondary)] border border-[var(--notion-border)] rounded-[var(--radius-md)] overflow-hidden flex flex-col h-[320px]">
          <div className="flex items-center justify-between p-5 border-b border-[var(--notion-border)] bg-[var(--notion-bg-secondary)] z-10">
            <div className="flex items-center gap-3">
              <Activity size={14} className="text-[var(--brand-cyan)]" />
              <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[var(--notion-text-secondary)]">System Log</span>
            </div>
          </div>
          <div className="overflow-y-auto flex-1 p-2">
            {loading ? (
              <div className="flex flex-col gap-2 p-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="skeleton h-10 w-full rounded-md opacity-20" />
                ))}
              </div>
            ) : activity.length > 0 ? (
              activity.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  className="group/l relative flex items-center gap-3 px-4 py-3 mx-2 my-1 rounded-md transition-all duration-200 hover:bg-[var(--notion-bg-tertiary)] border border-transparent hover:border-[var(--notion-border)]"
                >
                  <div className="w-6 h-6 flex items-center justify-center shrink-0 bg-[var(--notion-bg-tertiary)] border border-[var(--notion-border)] rounded-md">
                    {item.type === "task" ? (
                      <CheckSquare size={10} className="text-[var(--notion-text-muted)] group-hover/l:text-[var(--brand-cyan)] transition-colors" />
                    ) : (
                      <MessageSquare size={10} className="text-[var(--notion-text-muted)] group-hover/l:text-[var(--brand-cyan)] transition-colors" />
                    )}
                  </div>
                  <span className="flex-1 text-[12px] font-medium tracking-wide truncate text-[var(--notion-text)]">
                    {item.title}
                  </span>
                  <span className="text-[9px] font-mono tracking-widest uppercase text-[var(--notion-text-muted)] shrink-0">
                    {item.time}
                  </span>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-[var(--notion-text-muted)]">
                <Activity size={18} strokeWidth={1.5} />
                <span className="text-[10px] tracking-widest uppercase">No recent events</span>
              </div>
            )}
          </div>
        </div>

        {/* Admin Link Tile */}
        {isAdmin && (
          <div className="xl:col-span-4">
            <Link href="/dashboard/admin" style={{ textDecoration: 'none' }} className="group block bg-[var(--notion-bg-secondary)] border border-[var(--notion-border)] rounded-[var(--radius-md)] p-5 hover:border-[var(--brand-cyan)] hover:bg-[var(--notion-bg-tertiary)] transition-all">
              <div className="flex items-center justify-center gap-3 text-[var(--notion-text-muted)]">
                <Shield size={14} className="group-hover:text-[var(--brand-cyan)] transition-colors" />
                <span className="text-[10px] uppercase tracking-[0.25em] font-bold group-hover:text-[var(--notion-text)] transition-colors">Access Admin Diagnostics (v5.0)</span>
              </div>
            </Link>
          </div>
        )}
      </div>
`;

const file = 'src/app/dashboard/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Find the start and end indices
const startIndex = content.indexOf('<Breadcrumb />') + '<Breadcrumb />'.length;
const endIndex = content.indexOf('{/* Widget Picker Modal */}');

if (startIndex > -1 && endIndex > -1 && endIndex > startIndex) {
    const newContent = content.substring(0, startIndex) + '\n' + bentoGrid + '\n      ' + content.substring(endIndex);
    fs.writeFileSync(file, newContent);
    console.log('Successfully replaced old layout with new Bento Grid.');
} else {
    console.log('Could not find injection points.');
}
