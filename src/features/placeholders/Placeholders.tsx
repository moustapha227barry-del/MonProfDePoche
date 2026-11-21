import { useRouter } from "expo-router";

import { PlaceholderScreen } from "@/components/PlaceholderScreen";

export function BasketScreen() {
  return (
    <PlaceholderScreen
      icon="layers-outline"
      title="Mon panier"
      subtitle="Les enregistrements de la journée, réunis avant d’être transformés en cours structuré."
      features={[
        "Enregistrements du jour regroupés automatiquement",
        "Sélection multiple, 5 fichiers maximum par analyse",
        "Lancement de l’analyse dès la sélection validée",
      ]}
    />
  );
}

export function CoursesScreen() {
  return (
    <PlaceholderScreen
      icon="book-outline"
      title="Mes cours"
      subtitle="Chaque cours devient un document clair, chapitré et relisible."
      features={[
        "Chapitres, leçons et notions clés",
        "Définitions, formules, méthodes et exemples",
        "Recherche par matière et par notion",
      ]}
    />
  );
}

export function TutorScreen() {
  return (
    <PlaceholderScreen
      icon="chatbubble-ellipses-outline"
      title="Tuteur IA"
      subtitle="Un professeur patient qui explique à ton rythme et te laisse chercher."
      features={[
        "Explications progressives adaptées à ton niveau",
        "Questions libres et indices avant la réponse",
        "Historique des échanges par cours",
      ]}
    />
  );
}

export function ProgressScreen() {
  return (
    <PlaceholderScreen
      icon="stats-chart-outline"
      title="Ma progression"
      subtitle="Comprendre ce qui est acquis, ce qui résiste et ce qu’il faut revoir."
      features={[
        "Temps d’étude et régularité",
        "Résultats par matière et lacunes détectées",
        "Révisions planifiées selon tes oublis",
      ]}
    />
  );
}

export function RecordingScreen() {
  const router = useRouter();

  return (
    <PlaceholderScreen
      icon="mic-outline"
      title="Enregistrement"
      subtitle="Le cœur de l’application : capturer le cours sans jamais perdre le fil."
      features={[
        "Choix de la matière avant de démarrer",
        "Chronomètre et onde sonore en direct",
        "Démarrer, mettre en pause, reprendre et terminer",
      ]}
      onBack={() => router.back()}
    />
  );
}
