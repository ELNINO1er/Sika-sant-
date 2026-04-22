export const categories = [
  'Generaliste',
  'Pediatrie',
  'Dermatologie',
  'Cardiologie',
];

export const quickActions = [
  { id: 'appointments', label: 'Rendez-vous', icon: 'calendar-month' },
  { id: 'treatments', label: 'Traitements', icon: 'pill' },
  { id: 'reports', label: 'Documents', icon: 'file-document-outline' },
];

export const doctors = [
  {
    id: 'doctor-1',
    name: 'Dr. Aya Kouame',
    specialty: 'Dermatologie',
    rating: '4.9k avis',
    image: require('../../assets/images/doctor.jpg'),
  },
  {
    id: 'doctor-2',
    name: 'Dr. Fatou Diallo',
    specialty: 'Pediatrie',
    rating: '5.0k avis',
    image: require('../../assets/images/hero.jpg'),
  },
];

export const records = [
  {
    id: 'record-1',
    title: 'Compte rendu de consultation',
    detail: 'Mis a jour aujourd hui avec recommandations et prochaine visite.',
    icon: 'clipboard-text-outline',
  },
  {
    id: 'record-2',
    title: 'Analyse laboratoire',
    detail: 'Bilan sanguin disponible et partage avec le praticien referent.',
    icon: 'flask-outline',
  },
  {
    id: 'record-3',
    title: 'Ordonnance active',
    detail: 'Traitement acne en cours avec rappel de renouvellement.',
    icon: 'pill',
  },
];

export const conversation = [
  {
    id: 'msg-1',
    from: 'doctor',
    text: "Bonjour docteur, j'ai remarque une irritation sur le visage depuis plusieurs jours.",
  },
  {
    id: 'msg-2',
    from: 'patient',
    text: "Bonjour. Depuis combien de temps les rougeurs sont-elles apparues et a quel moment cela s'aggrave ?",
  },
  {
    id: 'msg-3',
    from: 'doctor',
    text: "Cela dure depuis trois semaines et c'est plus visible le soir apres la chaleur.",
  },
  {
    id: 'msg-4',
    from: 'patient',
    text: "D'accord. Je vais revoir votre traitement local et vous envoyer des conseils adaptes.",
  },
];

export const appointment = {
  doctor: 'Dr. Mattew Johnson',
  specialty: 'Dermatologie',
  datetime: 'Tue, Jan 20 | 10.00 AM',
  location: 'Clinique Sika Sante, Abidjan',
};
