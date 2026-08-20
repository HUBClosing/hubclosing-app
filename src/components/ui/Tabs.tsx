'use client';

import { useState } from 'react';
import clsx from 'clsx';

interface Tab {
  id: string;
  label: string;
  content: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  className?: string;
}

export function Tabs({ tabs, defaultTab, className }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  const activeContent = tabs.find((t) => t.id === activeTab)?.content;

  return (
    <div className={className}>
      <div className="flex gap-1 p-1 rounded-xl bg-gray-100/80">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={clsx(
              'flex-1 px-4 py-2 text-sm font-medium rounded-lg',
              'transition-all duration-200 ease-out',
              activeTab === tab.id
                ? 'bg-white text-brand-dark shadow-[0_1px_3px_rgba(0,0,0,0.08)] '
                : 'text-gray-500 hover:text-gray-700 hover:bg-white/50',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="mt-4">{activeContent}</div>
    </div>
  );
}
