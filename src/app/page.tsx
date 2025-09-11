"use client";

import { useState } from "react";
import AdminView from "@/components/app/admin-view";
import RecipientView from "@/components/app/recipient-view";
import type { Project } from "@/lib/types";
import { AppHeader } from "@/components/app/header";

export type ViewMode = "admin" | "recipient";

export default function Home() {
  const [view, setView] = useState<ViewMode>("admin");
  const [project, setProject] = useState<Project | null>(null);
  const [activeRecipientId, setActiveRecipientId] = useState<string | null>(null);

  const handleProjectChange = (newProject: Project) => {
    setProject(newProject);
    if (!activeRecipientId && newProject.recipients.length > 0) {
      setActiveRecipientId(newProject.recipients[0].id);
    }
    // if active recipient was removed, select the first one
    if (activeRecipientId && !newProject.recipients.find(r => r.id === activeRecipientId)) {
      setActiveRecipientId(newProject.recipients[0]?.id || null);
    }
  };

  const handleViewChange = (newView: ViewMode) => {
    if (newView === "recipient" && !project) {
        // Here you might want to use a toast notification
        console.warn("Crie um projeto antes de mudar para a visão do destinatário.");
        return;
    }
    setView(newView);
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader 
        view={view} 
        onViewChange={handleViewChange} 
        projectStatus={project?.status}
        notification={project?.notification}
      />
      <main className="p-4 sm:p-6 md:p-8 lg:p-12">
        {view === "admin" ? (
          <AdminView project={project} onProjectChange={handleProjectChange} />
        ) : project ? (
          <RecipientView
            project={project}
            activeRecipientId={activeRecipientId}
            setActiveRecipientId={setActiveRecipientId}
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-center py-20">
            <h2 className="text-2xl font-bold font-headline mb-2">Nenhum Projeto Ativo</h2>
            <p className="text-muted-foreground">
              Por favor, volte para a visão de administrador para criar um projeto.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
