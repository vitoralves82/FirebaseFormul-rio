"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from 'next/navigation';
import AdminView from "@/components/app/admin-view";
import RecipientView from "@/components/app/recipient-view";
import type { Project } from "@/lib/types";
import { AppHeader } from "@/components/app/header";

export type ViewMode = "admin" | "recipient";

function HomePageContent() {
  const searchParams = useSearchParams();
  const initialView = searchParams.get('view') as ViewMode | null;
  const projectIdFromUrl = searchParams.get('projectId');
  const recipientIdFromUrl = search_params.get('recipientId');

  const [view, setView] = useState<ViewMode>(initialView === 'recipient' ? 'recipient' : 'admin');
  const [project, setProject] = useState<Project | null>(null);
  const [activeRecipientId, setActiveRecipientId] = useState<string | null>(recipientIdFromUrl);

  // isRecipientSession is true if the user accessed the page with a recipient link
  const isRecipientSession = initialView === 'recipient' && !!projectIdFromUrl && !!recipientIdFromUrl;

  // This effect is a placeholder for fetching project data based on URL.
  // In a real app, you would fetch the project from a database using `projectIdFromUrl`.
  // Since we are using a mock DB in actions, we can't easily fetch it here.
  // The `AdminView` `onProjectChange` will set the project data for now.
  // When a recipient loads the URL, they won't see anything until a project is created.
  // This is a limitation of the current mock data setup.

  const handleProjectChange = (newProject: Project) => {
    setProject(newProject);
    
    // If accessed via URL, the recipient is fixed. Otherwise, manage it for admin preview.
    if (!isRecipientSession) {
      if (!activeRecipientId && newProject.recipients.length > 0) {
        setActiveRecipientId(newProject.recipients[0].id);
      }
      if (activeRecipientId && !newProject.recipients.find(r => r.id === activeRecipientId)) {
        setActiveRecipientId(newProject.recipients[0]?.id || null);
      }
    }
  };

  const handleViewChange = (newView: ViewMode) => {
    // Prevent switching to admin view if in a recipient session
    if (isRecipientSession) return;

    if (newView === "recipient" && !project) {
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
        isRecipientSession={isRecipientSession}
      />
      <main className="p-4 sm:p-6 md:p-8 lg:p-12">
        {view === "admin" && !isRecipientSession ? (
          <AdminView project={project} onProjectChange={handleProjectChange} />
        ) : project && activeRecipientId ? (
          <RecipientView
            project={project}
            activeRecipientId={activeRecipientId}
            setActiveRecipientId={setActiveRecipientId}
            isRecipientSession={isRecipientSession}
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-center py-20">
            <h2 className="text-2xl font-bold font-headline mb-2">{isRecipientSession ? "Formulário não encontrado" : "Nenhum Projeto Ativo"}</h2>
            <p className="text-muted-foreground">
              {isRecipientSession ? "Verifique o link ou entre em contato com o administrador." : "Por favor, volte para a visão de administrador para criar um projeto."}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <React.Suspense fallback={<div>Carregando...</div>}>
      <HomePageContent />
    </React.Suspense>
  )
}
