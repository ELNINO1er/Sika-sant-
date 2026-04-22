import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getHealth, getUserProfile } from '../services/api';
import { SikaLogo } from '../components/SikaLogo';
import {
  loginAdmin,
  loginInstitution,
  loginProfessional,
  logoutSession,
  requestOtp,
  resendMfa,
  verifyMfa,
  verifyOtp,
} from '../services/authMobile';
import { clearAuthSession, persistAuthSession, restoreAuthSession } from '../services/session';
import { appointment, categories, conversation, doctors, quickActions, records } from '../data/mockData';
import { colors, radii, shadows } from '../theme/tokens';

const heroImage = require('../../assets/images/hero.jpg');
const patientImage = require('../../assets/images/patient.jpg');
const doctorImage = require('../../assets/images/doctor.jpg');

const tabs = [
  { key: 'home', label: 'Home', icon: 'home-outline', iconSet: Ionicons },
  { key: 'records', label: 'Dossier', icon: 'file-tray-full-outline', iconSet: Ionicons },
  { key: 'chat', label: 'Messages', icon: 'chatbubble-ellipses-outline', iconSet: Ionicons },
  { key: 'profile', label: 'Profil', icon: 'person-outline', iconSet: Ionicons },
];

const authProfiles = {
  patient: {
    label: 'Patient',
    icon: 'person-heart',
    title: 'Connexion patient',
    description: 'Numero CMU puis code OTP pour acceder a votre carnet.',
    submitLabel: 'Recevoir un code OTP',
    verifyLabel: 'Verifier le code OTP',
  },
  professional: {
    label: 'Professionnel',
    icon: 'stethoscope',
    title: 'Connexion professionnel',
    description: 'Email professionnel et mot de passe, puis verification MFA.',
    submitLabel: 'Demander le code MFA',
    verifyLabel: 'Valider le code MFA',
  },
  admin: {
    label: 'Admin',
    icon: 'shield-lock',
    title: 'Connexion admin',
    description: 'Identifiants admin puis verification MFA.',
    submitLabel: 'Demander le code MFA',
    verifyLabel: 'Valider le code MFA',
  },
  institution: {
    label: 'Institution',
    icon: 'bank',
    title: 'Connexion institution',
    description: 'Identifiant de structure et mot de passe, puis verification MFA.',
    submitLabel: 'Demander le code MFA',
    verifyLabel: 'Valider le code MFA',
  },
};

function BrandMark() {
  return <SikaLogo size={58} />;
}

function emptyAuthState() {
  return {
    isAuthenticated: false,
    user: null,
    accessToken: null,
    refreshToken: null,
  };
}

function roleToProfile(role) {
  switch (role) {
    case 'professional':
      return 'professional';
    case 'admin':
      return 'admin';
    case 'institution':
      return 'institution';
    case 'patient':
    default:
      return 'patient';
  }
}

function AuthSelectorScreen({
  activeProfile,
  authStep,
  authContact,
  form,
  authMessage,
  pending,
  onBackToLanding,
  onProfileChange,
  onFieldChange,
  onPrimarySubmit,
  onVerifySubmit,
  onBack,
  onResend,
}) {
  const profile = authProfiles[activeProfile];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.authScroll} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={[colors.primary, colors.primaryDeep]} style={styles.authHero}>
          <Pressable onPress={onBackToLanding} style={styles.authBackButton}>
            <Ionicons name="arrow-back" size={18} color={colors.white} />
            <Text style={styles.authBackButtonText}>Accueil</Text>
          </Pressable>

          <View style={styles.authHeroTop}>
            <BrandMark />
            <View style={styles.authHeroCopy}>
              <Text style={styles.authHeroTitle}>Connexion Sika Sante</Text>
              <Text style={styles.authHeroText}>Choisissez votre profil comme sur le site web et connectez-vous.</Text>
            </View>
          </View>

          <View style={styles.authProfileGrid}>
            {Object.entries(authProfiles).map(([key, item]) => (
              <Pressable
                key={key}
                onPress={() => onProfileChange(key)}
                style={[styles.authProfileCard, key === activeProfile && styles.authProfileCardActive]}
              >
                <MaterialCommunityIcons
                  name={item.icon}
                  size={22}
                  color={key === activeProfile ? colors.primary : colors.white}
                />
                <Text style={[styles.authProfileLabel, key === activeProfile && styles.authProfileLabelActive]}>
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </LinearGradient>

        <View style={styles.authPanel}>
          <Text style={styles.authPanelTitle}>{profile.title}</Text>
          <Text style={styles.authPanelText}>{profile.description}</Text>

          {authMessage ? (
            <View style={[styles.authMessage, authMessage.type === 'error' ? styles.authMessageError : styles.authMessageSuccess]}>
              <Text style={styles.authMessageText}>{authMessage.text}</Text>
            </View>
          ) : null}

          {authStep === 'primary' ? (
            <View style={styles.authForm}>
              {activeProfile === 'patient' ? (
                <>
                  <Text style={styles.inputLabel}>Numero CMU</Text>
                  <TextInput
                    value={form.cmuNumber}
                    onChangeText={(value) => onFieldChange('cmuNumber', value)}
                    keyboardType="number-pad"
                    placeholder="1234567890"
                    placeholderTextColor={colors.textMuted}
                    maxLength={10}
                    style={styles.textInput}
                  />
                </>
              ) : activeProfile === 'institution' ? (
                <>
                  <Text style={styles.inputLabel}>Identifiant institutionnel</Text>
                  <TextInput
                    value={form.institutionId}
                    onChangeText={(value) => onFieldChange('institutionId', value)}
                    placeholder="GOV-CNAM-3001"
                    placeholderTextColor={colors.textMuted}
                    autoCapitalize="characters"
                    style={styles.textInput}
                  />
                  <Text style={styles.inputLabel}>Mot de passe</Text>
                  <TextInput
                    value={form.password}
                    onChangeText={(value) => onFieldChange('password', value)}
                    placeholder="Minimum 12 caracteres"
                    placeholderTextColor={colors.textMuted}
                    secureTextEntry
                    style={styles.textInput}
                  />
                </>
              ) : (
                <>
                  <Text style={styles.inputLabel}>{activeProfile === 'admin' ? 'Email admin' : 'Email professionnel'}</Text>
                  <TextInput
                    value={form.email}
                    onChangeText={(value) => onFieldChange('email', value)}
                    placeholder={activeProfile === 'admin' ? 'admin@sika-sante.ci' : 'medecin@structure.ci'}
                    placeholderTextColor={colors.textMuted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={styles.textInput}
                  />
                  <Text style={styles.inputLabel}>Mot de passe</Text>
                  <TextInput
                    value={form.password}
                    onChangeText={(value) => onFieldChange('password', value)}
                    placeholder="Minimum 12 caracteres"
                    placeholderTextColor={colors.textMuted}
                    secureTextEntry
                    style={styles.textInput}
                  />
                </>
              )}

              <Pressable onPress={onPrimarySubmit} disabled={pending} style={[styles.primaryButton, pending && styles.buttonDisabled]}>
                <Text style={styles.primaryButtonText}>{pending ? 'Connexion...' : profile.submitLabel}</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.authForm}>
              {authContact ? <Text style={styles.authHint}>Code envoye vers {authContact}.</Text> : null}
              <Text style={styles.inputLabel}>{activeProfile === 'patient' ? 'Code OTP' : 'Code MFA'}</Text>
              <TextInput
                value={form.code}
                onChangeText={(value) => onFieldChange('code', value)}
                keyboardType="number-pad"
                placeholder="000000"
                placeholderTextColor={colors.textMuted}
                maxLength={6}
                style={styles.textInput}
              />

              <Pressable onPress={onVerifySubmit} disabled={pending} style={[styles.primaryButton, pending && styles.buttonDisabled]}>
                <Text style={styles.primaryButtonText}>{pending ? 'Verification...' : profile.verifyLabel}</Text>
              </Pressable>

              <View style={styles.secondaryActionRow}>
                <Pressable onPress={onBack} style={styles.secondaryButton}>
                  <Text style={styles.secondaryButtonText}>Retour</Text>
                </Pressable>
                {activeProfile !== 'patient' ? (
                  <Pressable onPress={onResend} style={styles.secondaryButton}>
                    <Text style={styles.secondaryButtonText}>Renvoyer</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionHeading({ eyebrow, title, actionLabel, onActionPress }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeaderCopy}>
        {eyebrow ? <Text style={styles.sectionEyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {actionLabel ? (
        <Pressable onPress={onActionPress}>
          <Text style={styles.sectionAction}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function LandingScreen({ onContinue }) {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.onboardingShell}>
        <View style={styles.onboardingTop}>
          <ImageBackground imageStyle={styles.onboardingPhotoImage} source={heroImage} style={styles.onboardingPhoto}>
            <LinearGradient
              colors={['rgba(124, 77, 255, 0.08)', 'rgba(103, 53, 242, 0.42)']}
              style={styles.onboardingPhotoOverlay}
            />
            <View style={[styles.floatingIcon, styles.floatingIconLeft]}>
              <MaterialCommunityIcons name="medical-bag" size={26} color={colors.sageDeep} />
            </View>
            <View style={[styles.floatingIcon, styles.floatingIconRight]}>
              <MaterialCommunityIcons name="pill" size={24} color={colors.sageDeep} />
            </View>
          </ImageBackground>
        </View>

        <View style={styles.onboardingPanel}>
          <View style={styles.onboardingBrandRow}>
            <BrandMark />
            <View style={styles.onboardingBrandCopy}>
              <Text style={styles.onboardingBrandTitle}>SIKA SANTE</Text>
              <Text style={styles.onboardingBrandText}>Carnet de sante electronique</Text>
            </View>
          </View>
          <Text style={styles.onboardingTitle}>Une plateforme qui relie le patient, le soignant et l&apos;institution</Text>
          <Text style={styles.onboardingCopy}>
            Sika Sante centralise le dossier medical, facilite la coordination clinique et donne a chaque profil un
            acces plus clair a son espace.
          </Text>

          <View style={styles.onboardingFeatureRow}>
            <View style={styles.onboardingFeatureChip}>
              <Ionicons name="shield-checkmark-outline" size={18} color={colors.primary} />
              <Text style={styles.onboardingFeatureText}>Dossier securise</Text>
            </View>
            <View style={styles.onboardingFeatureChip}>
              <Ionicons name="notifications-outline" size={18} color={colors.primary} />
              <Text style={styles.onboardingFeatureText}>Suivi clinique</Text>
            </View>
            <View style={styles.onboardingFeatureChip}>
              <Ionicons name="people-outline" size={18} color={colors.primary} />
              <Text style={styles.onboardingFeatureText}>4 espaces metier</Text>
            </View>
          </View>

          <Pressable onPress={onContinue} style={styles.onboardingPrimaryButton}>
            <Text style={styles.onboardingPrimaryButtonText}>Connexion</Text>
            <Ionicons name="arrow-forward" size={18} color={colors.white} />
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

function HomeScreen({ healthState, onTestBackend, onOpenChat, user }) {
  const displayName = user?.name || 'Utilisateur';

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.headerRow}>
        <View style={styles.headerProfile}>
          <Image source={patientImage} style={styles.avatarLarge} />
          <View>
            <Text style={styles.headerName}>{displayName},</Text>
            <Text style={styles.headerSubtitle}>Bienvenue sur Sika Sante</Text>
          </View>
        </View>
        <Pressable style={styles.iconFab}>
          <Ionicons name="notifications-outline" size={24} color={colors.text} />
          <View style={styles.notificationBadge}>
            <Text style={styles.notificationBadgeText}>12</Text>
          </View>
        </Pressable>
      </View>

      <LinearGradient colors={[colors.sage, colors.sageDeep]} style={styles.heroCard}>
        <View style={styles.heroCardCopy}>
          <Text style={styles.heroCardTitle}>Coordonnez soins, documents et messages dans un seul espace.</Text>
          <Text style={styles.heroCardText}>
            Une lecture plus claire du parcours patient, avec une interface mobile inspiree de vos maquettes.
          </Text>
          <Pressable onPress={onTestBackend} style={styles.heroAction}>
            <Text style={styles.heroActionText}>{healthState.loading ? 'Verification...' : 'Tester le backend'}</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.text} />
          </Pressable>
        </View>
        <Image source={heroImage} style={styles.heroDoctorImage} />
      </LinearGradient>

      <View style={styles.paginationDots}>
        <View style={[styles.paginationDot, styles.paginationDotActive]} />
        <View style={styles.paginationDot} />
        <View style={styles.paginationDot} />
      </View>

      <SectionHeading title="Prochain rendez-vous" />
      <View style={styles.appointmentCard}>
        <Image source={doctorImage} style={styles.appointmentImage} />
        <View style={styles.appointmentBody}>
          <Text style={styles.appointmentDoctor}>{appointment.doctor}</Text>
          <Text style={styles.appointmentSpecialty}>{appointment.specialty}</Text>
          <Text style={styles.appointmentMeta}>{appointment.datetime}</Text>
          <Text style={styles.appointmentLocation}>{appointment.location}</Text>
        </View>
        <Pressable style={styles.detailButton}>
          <Text style={styles.detailButtonText}>Voir</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.text} />
        </Pressable>
      </View>

      <SectionHeading title="Categories" actionLabel="Voir tout" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
        <Pressable style={styles.categoryIcon}>
          <MaterialCommunityIcons name="tune-vertical-variant" size={20} color={colors.text} />
        </Pressable>
        {categories.map((category, index) => (
          <Pressable key={category} style={[styles.categoryChip, index === 0 && styles.categoryChipActive]}>
            <Text style={[styles.categoryChipText, index === 0 && styles.categoryChipTextActive]}>{category}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <SectionHeading title="Top praticiens" actionLabel="Messagerie" onActionPress={onOpenChat} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.doctorsRow}>
        {doctors.map((doctor) => (
          <View key={doctor.id} style={styles.doctorCard}>
            <View style={styles.doctorCardCopy}>
              <Text style={styles.doctorCardName}>{doctor.name}</Text>
              <Text style={styles.doctorCardSpecialty}>{doctor.specialty}</Text>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={16} color={colors.warning} />
                <Text style={styles.ratingText}>{doctor.rating}</Text>
              </View>
            </View>
            <Image source={doctor.image} style={styles.doctorCardImage} />
          </View>
        ))}
      </ScrollView>

      <SectionHeading title="Actions rapides" />
      <View style={styles.quickActionsGrid}>
        {quickActions.map((item) => (
          <View key={item.id} style={styles.quickActionCard}>
            <View style={styles.quickActionIcon}>
              <MaterialCommunityIcons name={item.icon} size={22} color={colors.primary} />
            </View>
            <Text style={styles.quickActionLabel}>{item.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.healthBanner}>
        <View style={styles.healthBannerCopy}>
          <Text style={styles.healthBannerEyebrow}>Etat API</Text>
          <Text style={styles.healthBannerTitle}>{healthState.label}</Text>
        </View>
        <View style={[styles.healthBadge, healthState.ok ? styles.healthBadgeSuccess : styles.healthBadgePending]}>
          <Text style={styles.healthBadgeText}>{healthState.ok ? 'OK' : 'Info'}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

function RecordsScreen() {
  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <SectionHeading eyebrow="Dossier patient" title="Documents, analyses et traitements utiles au quotidien" />

      <View style={styles.recordsHero}>
        <BrandMark />
        <View style={styles.recordsHeroCopy}>
          <Text style={styles.recordsHeroTitle}>Carnet medical centralise</Text>
          <Text style={styles.recordsHeroText}>
            Une lecture simple du dossier, alignee sur la marque Sika et la douceur visuelle des maquettes.
          </Text>
        </View>
      </View>

      {records.map((record) => (
        <View key={record.id} style={styles.recordCard}>
          <View style={styles.recordIcon}>
            <MaterialCommunityIcons name={record.icon} size={24} color={colors.sageDeep} />
          </View>
          <View style={styles.recordCopy}>
            <Text style={styles.recordTitle}>{record.title}</Text>
            <Text style={styles.recordText}>{record.detail}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </View>
      ))}

      <View style={styles.treatmentCard}>
        <Text style={styles.treatmentEyebrow}>Traitement actif</Text>
        <Text style={styles.treatmentTitle}>Routine dermatologique suivie par Dr. Aya Kouame</Text>
        <Text style={styles.treatmentText}>
          Nettoyant doux matin et soir, creme apaisante et consultation de suivi dans 7 jours.
        </Text>
      </View>
    </ScrollView>
  );
}

function ChatScreen() {
  return (
    <View style={styles.chatScreen}>
      <View style={styles.chatHeader}>
        <Pressable style={styles.iconFab}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <View style={styles.chatHeaderTitle}>
          <Text style={styles.chatHeaderName}>{appointment.doctor}</Text>
          <Text style={styles.chatHeaderRole}>{appointment.specialty}</Text>
        </View>
        <Pressable style={styles.iconFab}>
          <Feather name="phone-call" size={20} color={colors.text} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.chatList} showsVerticalScrollIndicator={false}>
        {conversation.map((message) => {
          const isDoctor = message.from === 'doctor';
          return (
            <View key={message.id} style={[styles.messageRow, isDoctor ? styles.messageRowRight : styles.messageRowLeft]}>
              {!isDoctor ? <Image source={patientImage} style={styles.messageAvatar} /> : null}
              <View style={[styles.messageBubble, isDoctor ? styles.messageBubbleDoctor : styles.messageBubblePatient]}>
                <Text style={[styles.messageText, isDoctor && styles.messageTextDoctor]}>{message.text}</Text>
              </View>
              {isDoctor ? <Image source={doctorImage} style={styles.messageAvatar} /> : null}
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.composerShell}>
        <View style={styles.composerInputWrap}>
          <TextInput
            editable={false}
            placeholder="Tapez votre message..."
            placeholderTextColor={colors.textMuted}
            style={styles.composerInput}
          />
          <Pressable style={styles.cameraButton}>
            <Feather name="camera" size={22} color={colors.text} />
          </Pressable>
        </View>
        <Pressable style={styles.sendButton}>
          <Ionicons name="send" size={24} color={colors.white} />
        </Pressable>
      </View>
    </View>
  );
}

function ProfileScreen({ user, onLogout, logoutPending }) {
  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.profileCard}>
        <LinearGradient colors={[colors.primary, colors.violet]} style={styles.profileGradient}>
          <BrandMark />
          <Image source={patientImage} style={styles.profileImage} />
          <Text style={styles.profileName}>{user?.name || 'Utilisateur Sika'}</Text>
          <Text style={styles.profileRole}>{user?.role || 'Profil mobile'}</Text>
        </LinearGradient>

        <View style={styles.profileMetrics}>
          <View style={styles.profileMetric}>
            <Text style={styles.profileMetricValue}>12</Text>
            <Text style={styles.profileMetricLabel}>Documents</Text>
          </View>
          <View style={styles.profileMetric}>
            <Text style={styles.profileMetricValue}>04</Text>
            <Text style={styles.profileMetricLabel}>Medecins</Text>
          </View>
          <View style={styles.profileMetric}>
            <Text style={styles.profileMetricValue}>07</Text>
            <Text style={styles.profileMetricLabel}>Messages</Text>
          </View>
        </View>
      </View>

      <View style={styles.settingItem}>
        <Feather name="shield" size={20} color={colors.primary} />
        <Text style={styles.settingLabel}>Securite et authentification</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </View>
      <View style={styles.settingItem}>
        <Feather name="bell" size={20} color={colors.primary} />
        <Text style={styles.settingLabel}>Notifications cliniques</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </View>
      <View style={styles.settingItem}>
        <Feather name="file-text" size={20} color={colors.primary} />
        <Text style={styles.settingLabel}>Consentements et partage</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </View>

      <Pressable onPress={onLogout} disabled={logoutPending} style={[styles.logoutButton, logoutPending && styles.buttonDisabled]}>
        {logoutPending ? <ActivityIndicator color={colors.white} /> : <Text style={styles.logoutButtonText}>Se deconnecter</Text>}
      </Pressable>
    </ScrollView>
  );
}

function TabBar({ activeTab, onTabChange }) {
  return (
    <View style={styles.tabBar}>
      {tabs.map((tab) => {
        const Icon = tab.iconSet;
        const isActive = tab.key === activeTab;
        return (
          <Pressable key={tab.key} onPress={() => onTabChange(tab.key)} style={[styles.tabItem, isActive && styles.tabItemActive]}>
            <Icon name={tab.icon} size={23} color={isActive ? colors.white : colors.text} />
            {isActive ? <Text style={styles.tabLabelActive}>{tab.label}</Text> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

export function MobilePrototypeScreen() {
  const [entryStep, setEntryStep] = useState('landing');
  const [bootingSession, setBootingSession] = useState(true);
  const [authState, setAuthState] = useState(emptyAuthState);
  const [activeProfile, setActiveProfile] = useState('patient');
  const [authStep, setAuthStep] = useState('primary');
  const [authPending, setAuthPending] = useState(false);
  const [authRequestId, setAuthRequestId] = useState(null);
  const [authContact, setAuthContact] = useState('');
  const [authMessage, setAuthMessage] = useState(null);
  const [logoutPending, setLogoutPending] = useState(false);
  const [form, setForm] = useState({
    cmuNumber: '',
    email: '',
    password: '',
    institutionId: '',
    code: '',
  });
  const [activeTab, setActiveTab] = useState('home');
  const [healthState, setHealthState] = useState({
    loading: false,
    ok: false,
      label: 'Backend non verifie pour le moment.',
  });

  useEffect(() => {
    let isMounted = true;

    async function bootstrapSession() {
      try {
        const storedSession = await restoreAuthSession();
        if (!storedSession?.accessToken && !storedSession?.refreshToken) {
          return;
        }

        if (isMounted) {
          setAuthState({
            isAuthenticated: true,
            user: storedSession.user || null,
            accessToken: storedSession.accessToken || null,
            refreshToken: storedSession.refreshToken || null,
          });
          setActiveProfile(roleToProfile(storedSession.user?.role));
        }

        const profileResponse = await getUserProfile();
        const refreshedSession = await restoreAuthSession();
        const nextState = {
          isAuthenticated: true,
          user: profileResponse?.data || storedSession.user || null,
          accessToken: refreshedSession?.accessToken || storedSession.accessToken || null,
          refreshToken: refreshedSession?.refreshToken || storedSession.refreshToken || null,
        };

        await persistAuthSession(nextState);

        if (isMounted) {
          setAuthState(nextState);
          setActiveProfile(roleToProfile(nextState.user?.role));
          setActiveTab('home');
        }
      } catch {
        await clearAuthSession();
        if (isMounted) {
          setAuthState(emptyAuthState());
          setEntryStep('landing');
        }
      } finally {
        if (isMounted) {
          setBootingSession(false);
        }
      }
    }

    bootstrapSession();

    return () => {
      isMounted = false;
    };
  }, []);

  function changeField(field, value) {
    setForm(current => ({ ...current, [field]: value }));
  }

  function resetFlowForProfile(profile) {
    setActiveProfile(profile);
    setAuthStep('primary');
    setAuthRequestId(null);
    setAuthContact('');
    setAuthMessage(null);
    setForm({
      cmuNumber: '',
      email: '',
      password: '',
      institutionId: '',
      code: '',
    });
  }

  function setError(message) {
    setAuthMessage({ type: 'error', text: message });
  }

  function setSuccess(message) {
    setAuthMessage({ type: 'success', text: message });
  }

  async function handlePrimaryAuth() {
    setAuthPending(true);
    setAuthMessage(null);

    try {
      if (activeProfile === 'patient') {
        if (!/^[0-9]{10}$/.test(form.cmuNumber.trim())) {
          throw new Error('Le numero CMU doit contenir exactement 10 chiffres.');
        }

        const response = await requestOtp(form.cmuNumber.trim());
        setAuthRequestId(response?.data?.otpRequestId);
        setAuthStep('verify');
        setSuccess(`Code OTP envoye au contact ${response?.data?.phoneNumber || 'masque'}.`);
        return;
      }

      if (activeProfile === 'institution') {
        if (!/^GOV-[A-Z]+-\d{4}$/i.test(form.institutionId.trim())) {
          throw new Error('Identifiant institutionnel invalide. Format attendu: GOV-CNAM-3001.');
        }
        if (form.password.trim().length < 12) {
          throw new Error('Le mot de passe doit contenir au moins 12 caracteres.');
        }

        const response = await loginInstitution(form.institutionId.trim(), form.password.trim());
        setAuthRequestId(response?.data?.mfaRequestId);
        setAuthContact(response?.data?.mfaContact || '');
        setAuthStep('verify');
        setSuccess(`Code MFA envoye vers ${response?.data?.mfaContact || 'votre contact'}.`);
        return;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
        throw new Error('Adresse email invalide.');
      }
      if (form.password.trim().length < 12) {
        throw new Error('Le mot de passe doit contenir au moins 12 caracteres.');
      }

      const response = activeProfile === 'admin'
        ? await loginAdmin(form.email.trim(), form.password.trim())
        : await loginProfessional(form.email.trim(), form.password.trim());

      setAuthRequestId(response?.data?.mfaRequestId);
      setAuthContact(response?.data?.mfaContact || '');
      setAuthStep('verify');
      setSuccess(`Code MFA envoye vers ${response?.data?.mfaContact || 'votre contact'}.`);
    } catch (error) {
      setError(error.message || 'Connexion impossible.');
    } finally {
      setAuthPending(false);
    }
  }

  async function handleVerifyAuth() {
    setAuthPending(true);
    setAuthMessage(null);

    try {
      if (!/^[0-9]{6}$/.test(form.code.trim())) {
        throw new Error('Le code doit contenir 6 chiffres.');
      }

      const response = activeProfile === 'patient'
        ? await verifyOtp(authRequestId, form.code.trim())
        : await verifyMfa(authRequestId, form.code.trim());

      const nextState = {
        isAuthenticated: true,
        user: response?.data?.userData || null,
        accessToken: response?.data?.accessToken || null,
        refreshToken: response?.data?.refreshToken || null,
      };

      await persistAuthSession(nextState);

      try {
        const profileResponse = await getUserProfile();
        nextState.user = profileResponse?.data || nextState.user;
      } catch {
        // Keep the user payload returned by the auth endpoint when profile fetch fails.
      }

      await persistAuthSession(nextState);
      setAuthState(nextState);
      setActiveProfile(roleToProfile(nextState.user?.role || activeProfile));
      setActiveTab('home');
      setAuthMessage(null);
    } catch (error) {
      setError(error.message || 'Verification impossible.');
    } finally {
      setAuthPending(false);
    }
  }

  async function handleResend() {
    setAuthPending(true);
    setAuthMessage(null);

    try {
      const response = await resendMfa(authRequestId);
      setAuthRequestId(response?.data?.mfaRequestId);
      setAuthContact(response?.data?.mfaContact || '');
      setSuccess(`Nouveau code envoye vers ${response?.data?.mfaContact || 'votre contact'}.`);
    } catch (error) {
      setError(error.message || 'Impossible de renvoyer le code.');
    } finally {
      setAuthPending(false);
    }
  }

  async function handleLogout() {
    setLogoutPending(true);

    try {
      if (authState.refreshToken) {
        await logoutSession(authState.refreshToken);
      }
    } catch {
      // Local cleanup stays authoritative for mobile logout.
    } finally {
      await clearAuthSession();
      setAuthState(emptyAuthState());
      setEntryStep('landing');
      setActiveProfile('patient');
      setAuthStep('primary');
      setAuthRequestId(null);
      setAuthContact('');
      setAuthMessage(null);
      setActiveTab('home');
      setForm({
        cmuNumber: '',
        email: '',
        password: '',
        institutionId: '',
        code: '',
      });
      setLogoutPending(false);
    }
  }

  async function handleTestBackend() {
    setHealthState({
      loading: true,
      ok: false,
      label: 'Verification du service en cours...',
    });

    try {
      const response = await getHealth();
      const status = response?.data?.status || 'ok';
      setHealthState({
        loading: false,
        ok: true,
        label: `API disponible: ${status}`,
      });
    } catch (error) {
      setHealthState({
        loading: false,
        ok: false,
        label: error.message || 'Connexion backend indisponible.',
      });
    }
  }

  const screen = useMemo(() => {
    if (bootingSession) {
      return (
        <View style={styles.sessionLoader}>
          <BrandMark />
          <ActivityIndicator size="large" color={colors.primary} style={styles.sessionLoaderSpinner} />
          <Text style={styles.sessionLoaderTitle}>Restauration de votre session</Text>
          <Text style={styles.sessionLoaderText}>Connexion a l&apos;espace Sika Sante...</Text>
        </View>
      );
    }

    if (!authState.isAuthenticated) {
      if (entryStep === 'landing') {
        return <LandingScreen onContinue={() => setEntryStep('auth')} />;
      }

      return (
        <AuthSelectorScreen
          activeProfile={activeProfile}
          authStep={authStep}
          authContact={authContact}
          form={form}
          authMessage={authMessage}
          pending={authPending}
          onBackToLanding={() => setEntryStep('landing')}
          onProfileChange={resetFlowForProfile}
          onFieldChange={changeField}
          onPrimarySubmit={handlePrimaryAuth}
          onVerifySubmit={handleVerifyAuth}
          onBack={() => {
            setAuthStep('primary');
            setAuthMessage(null);
            setForm(current => ({ ...current, code: '' }));
          }}
          onResend={handleResend}
        />
      );
    }

    if (activeTab === 'records') {
      return <RecordsScreen />;
    }

    if (activeTab === 'chat') {
      return <ChatScreen />;
    }

    if (activeTab === 'profile') {
      return <ProfileScreen user={authState.user} onLogout={handleLogout} logoutPending={logoutPending} />;
    }

    return (
      <HomeScreen
        user={authState.user}
        healthState={healthState}
        onTestBackend={handleTestBackend}
        onOpenChat={() => setActiveTab('chat')}
      />
    );
  }, [activeProfile, authContact, authMessage, authPending, authState.isAuthenticated, authState.user, authStep, bootingSession, entryStep, form, activeTab, healthState, logoutPending]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.appShell}>
        {screen}
        {!bootingSession && authState.isAuthenticated ? <TabBar activeTab={activeTab} onTabChange={setActiveTab} /> : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  appShell: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 150,
  },
  onboardingShell: {
    flex: 1,
    backgroundColor: colors.sage,
  },
  onboardingTop: {
    flex: 1.05,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  authScroll: {
    paddingBottom: 36,
  },
  authHero: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 28,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  authBackButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  authBackButtonText: {
    color: colors.white,
    fontFamily: 'Manrope_700Bold',
    fontSize: 14,
  },
  authHeroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 24,
  },
  authHeroCopy: {
    flex: 1,
  },
  authHeroTitle: {
    color: colors.white,
    fontFamily: 'Sora_700Bold',
    fontSize: 24,
  },
  authHeroText: {
    marginTop: 6,
    color: 'rgba(255,255,255,0.82)',
    fontFamily: 'Manrope_500Medium',
    fontSize: 15,
    lineHeight: 22,
  },
  authProfileGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  authProfileCard: {
    width: '47%',
    minHeight: 88,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    justifyContent: 'space-between',
  },
  authProfileCardActive: {
    backgroundColor: colors.white,
  },
  authProfileLabel: {
    color: colors.white,
    fontFamily: 'Manrope_700Bold',
    fontSize: 15,
  },
  authProfileLabelActive: {
    color: colors.primary,
  },
  authPanel: {
    marginHorizontal: 24,
    marginTop: 24,
    padding: 22,
    borderRadius: 28,
    backgroundColor: colors.white,
    ...shadows.card,
  },
  authPanelTitle: {
    color: colors.text,
    fontFamily: 'Sora_700Bold',
    fontSize: 24,
  },
  authPanelText: {
    marginTop: 8,
    color: colors.textSoft,
    fontFamily: 'Manrope_500Medium',
    fontSize: 15,
    lineHeight: 23,
  },
  authMessage: {
    marginTop: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
  },
  authMessageError: {
    backgroundColor: 'rgba(255, 90, 96, 0.12)',
  },
  authMessageSuccess: {
    backgroundColor: 'rgba(124, 77, 255, 0.12)',
  },
  authMessageText: {
    color: colors.text,
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 14,
    lineHeight: 21,
  },
  authHint: {
    marginBottom: 12,
    color: colors.textSoft,
    fontFamily: 'Manrope_500Medium',
    fontSize: 14,
    lineHeight: 22,
  },
  authForm: {
    marginTop: 18,
    gap: 12,
  },
  inputLabel: {
    color: colors.text,
    fontFamily: 'Manrope_700Bold',
    fontSize: 14,
  },
  textInput: {
    minHeight: 56,
    paddingHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceSoft,
    color: colors.text,
    fontFamily: 'Manrope_500Medium',
    fontSize: 15,
  },
  primaryButton: {
    marginTop: 8,
    minHeight: 58,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    ...shadows.button,
  },
  buttonDisabled: {
    opacity: 0.72,
  },
  primaryButtonText: {
    color: colors.white,
    fontFamily: 'Manrope_700Bold',
    fontSize: 16,
  },
  secondaryActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  secondaryButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSoft,
  },
  secondaryButtonText: {
    color: colors.text,
    fontFamily: 'Manrope_700Bold',
    fontSize: 15,
  },
  onboardingPhoto: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: 28,
    backgroundColor: '#B0B0B0',
  },
  onboardingPhotoImage: {
    resizeMode: 'cover',
  },
  onboardingPhotoOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  floatingIcon: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: radii.pill,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
  floatingIconLeft: {
    top: '42%',
    left: 22,
  },
  floatingIconRight: {
    top: 24,
    right: 22,
  },
  onboardingPanel: {
    flex: 0.85,
    marginTop: -28,
    backgroundColor: colors.white,
    borderTopLeftRadius: 180,
    borderTopRightRadius: 180,
    paddingHorizontal: 28,
    paddingTop: 34,
    alignItems: 'center',
  },
  onboardingBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    alignSelf: 'stretch',
    justifyContent: 'center',
  },
  onboardingBrandCopy: {
    alignItems: 'flex-start',
  },
  onboardingBrandTitle: {
    color: colors.text,
    fontFamily: 'Sora_700Bold',
    fontSize: 17,
    letterSpacing: -0.3,
  },
  onboardingBrandText: {
    marginTop: 2,
    color: colors.textMuted,
    fontFamily: 'Manrope_500Medium',
    fontSize: 13,
  },
  onboardingTitle: {
    marginTop: 24,
    color: colors.text,
    textAlign: 'center',
    fontFamily: 'Sora_700Bold',
    fontSize: 24,
    lineHeight: 32,
  },
  onboardingCopy: {
    marginTop: 16,
    color: colors.textSoft,
    textAlign: 'center',
    fontFamily: 'Manrope_500Medium',
    fontSize: 17,
    lineHeight: 28,
  },
  onboardingFeatureRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginTop: 24,
  },
  onboardingFeatureChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceSoft,
  },
  onboardingFeatureText: {
    color: colors.text,
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 14,
  },
  onboardingPrimaryButton: {
    marginTop: 26,
    minWidth: 220,
    minHeight: 58,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
    ...shadows.button,
  },
  onboardingPrimaryButtonText: {
    color: colors.white,
    fontFamily: 'Manrope_700Bold',
    fontSize: 16,
  },
  sessionLoader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    backgroundColor: colors.background,
  },
  sessionLoaderSpinner: {
    marginTop: 24,
  },
  sessionLoaderTitle: {
    marginTop: 20,
    color: colors.text,
    fontFamily: 'Sora_700Bold',
    fontSize: 20,
    textAlign: 'center',
  },
  sessionLoaderText: {
    marginTop: 10,
    color: colors.textSoft,
    fontFamily: 'Manrope_500Medium',
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  headerProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  avatarLarge: {
    width: 58,
    height: 58,
    borderRadius: radii.pill,
  },
  headerName: {
    color: colors.text,
    fontFamily: 'Sora_700Bold',
    fontSize: 17,
  },
  headerSubtitle: {
    marginTop: 2,
    color: colors.textSoft,
    fontFamily: 'Manrope_500Medium',
    fontSize: 15,
  },
  iconFab: {
    width: 58,
    height: 58,
    borderRadius: radii.pill,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
  notificationBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    minWidth: 24,
    height: 24,
    paddingHorizontal: 6,
    borderRadius: radii.pill,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadgeText: {
    color: colors.white,
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
  },
  heroCard: {
    marginTop: 28,
    borderRadius: radii.lg,
    padding: 24,
    overflow: 'hidden',
    minHeight: 250,
    ...shadows.card,
  },
  heroCardCopy: {
    maxWidth: '64%',
    zIndex: 2,
  },
  heroCardTitle: {
    color: colors.white,
    fontFamily: 'Sora_700Bold',
    fontSize: 30,
    lineHeight: 36,
  },
  heroCardText: {
    marginTop: 14,
    color: 'rgba(255,255,255,0.86)',
    fontFamily: 'Manrope_500Medium',
    fontSize: 16,
    lineHeight: 24,
  },
  heroAction: {
    marginTop: 22,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: radii.pill,
    backgroundColor: colors.white,
  },
  heroActionText: {
    color: colors.text,
    fontFamily: 'Manrope_700Bold',
    fontSize: 15,
  },
  heroDoctorImage: {
    position: 'absolute',
    right: -6,
    bottom: 0,
    width: 190,
    height: 260,
    resizeMode: 'cover',
    borderTopLeftRadius: 38,
  },
  paginationDots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 14,
    marginBottom: 24,
  },
  paginationDot: {
    width: 10,
    height: 10,
    borderRadius: radii.pill,
    backgroundColor: '#AABBB7',
  },
  paginationDotActive: {
    width: 42,
    backgroundColor: colors.sage,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  sectionHeaderCopy: {
    flex: 1,
  },
  sectionEyebrow: {
    color: colors.primary,
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  sectionTitle: {
    color: colors.text,
    fontFamily: 'Sora_700Bold',
    fontSize: 18,
  },
  sectionAction: {
    color: colors.textMuted,
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 15,
  },
  appointmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 18,
    borderRadius: 28,
    backgroundColor: colors.sage,
    marginBottom: 28,
  },
  appointmentImage: {
    width: 110,
    height: 126,
    borderRadius: 22,
  },
  appointmentBody: {
    flex: 1,
  },
  appointmentDoctor: {
    color: colors.white,
    fontFamily: 'Sora_700Bold',
    fontSize: 16,
  },
  appointmentSpecialty: {
    marginTop: 4,
    color: 'rgba(255,255,255,0.78)',
    fontFamily: 'Manrope_500Medium',
    fontSize: 15,
  },
  appointmentMeta: {
    marginTop: 18,
    color: colors.white,
    fontFamily: 'Manrope_700Bold',
    fontSize: 15,
  },
  appointmentLocation: {
    marginTop: 6,
    color: 'rgba(255,255,255,0.78)',
    fontFamily: 'Manrope_500Medium',
    fontSize: 13,
    lineHeight: 20,
  },
  detailButton: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: radii.pill,
    backgroundColor: colors.white,
  },
  detailButtonText: {
    color: colors.text,
    fontFamily: 'Manrope_700Bold',
    fontSize: 14,
  },
  categoryRow: {
    paddingBottom: 8,
    gap: 12,
    marginBottom: 28,
  },
  categoryIcon: {
    width: 56,
    height: 56,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    ...shadows.card,
  },
  categoryChip: {
    height: 56,
    paddingHorizontal: 24,
    borderRadius: radii.pill,
    justifyContent: 'center',
    backgroundColor: colors.white,
    ...shadows.card,
  },
  categoryChipActive: {
    backgroundColor: colors.sage,
  },
  categoryChipText: {
    color: colors.text,
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 15,
  },
  categoryChipTextActive: {
    color: colors.white,
  },
  doctorsRow: {
    gap: 14,
    paddingBottom: 8,
    marginBottom: 28,
  },
  doctorCard: {
    width: 270,
    minHeight: 142,
    borderRadius: 30,
    backgroundColor: colors.sage,
    overflow: 'hidden',
    justifyContent: 'space-between',
  },
  doctorCardCopy: {
    padding: 22,
    paddingRight: 108,
  },
  doctorCardName: {
    color: colors.white,
    fontFamily: 'Sora_700Bold',
    fontSize: 16,
    lineHeight: 22,
  },
  doctorCardSpecialty: {
    marginTop: 6,
    color: 'rgba(255,255,255,0.78)',
    fontFamily: 'Manrope_500Medium',
    fontSize: 14,
  },
  doctorCardImage: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 106,
    height: 142,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
  },
  ratingText: {
    color: colors.white,
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 14,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 28,
  },
  quickActionCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 18,
    borderRadius: 28,
    backgroundColor: colors.white,
    gap: 10,
    ...shadows.card,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSoft,
  },
  quickActionLabel: {
    color: colors.text,
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 14,
  },
  healthBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    padding: 18,
    borderRadius: 26,
    backgroundColor: colors.surfaceSoft,
  },
  healthBannerCopy: {
    flex: 1,
  },
  healthBannerEyebrow: {
    color: colors.textMuted,
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  healthBannerTitle: {
    marginTop: 6,
    color: colors.text,
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 15,
    lineHeight: 22,
  },
  healthBadge: {
    minWidth: 54,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radii.pill,
    alignItems: 'center',
  },
  healthBadgeSuccess: {
    backgroundColor: 'rgba(124, 77, 255, 0.14)',
  },
  healthBadgePending: {
    backgroundColor: 'rgba(124, 77, 255, 0.1)',
  },
  healthBadgeText: {
    color: colors.text,
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
  },
  recordsHero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 22,
    borderRadius: 28,
    backgroundColor: colors.white,
    marginBottom: 20,
    ...shadows.card,
  },
  brandBadge: {
    width: 58,
    height: 58,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandBadgeText: {
    color: colors.white,
    fontFamily: 'Sora_700Bold',
    fontSize: 26,
  },
  recordsHeroCopy: {
    flex: 1,
  },
  recordsHeroTitle: {
    color: colors.text,
    fontFamily: 'Sora_700Bold',
    fontSize: 18,
  },
  recordsHeroText: {
    marginTop: 8,
    color: colors.textSoft,
    fontFamily: 'Manrope_500Medium',
    fontSize: 15,
    lineHeight: 22,
  },
  recordCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 18,
    borderRadius: 24,
    backgroundColor: colors.white,
    marginBottom: 14,
    ...shadows.card,
  },
  recordIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.sageSoft,
  },
  recordCopy: {
    flex: 1,
  },
  recordTitle: {
    color: colors.text,
    fontFamily: 'Sora_600SemiBold',
    fontSize: 16,
  },
  recordText: {
    marginTop: 6,
    color: colors.textSoft,
    fontFamily: 'Manrope_500Medium',
    fontSize: 14,
    lineHeight: 21,
  },
  treatmentCard: {
    marginTop: 10,
    padding: 24,
    borderRadius: 28,
    backgroundColor: colors.sage,
  },
  treatmentEyebrow: {
    color: 'rgba(255,255,255,0.72)',
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  treatmentTitle: {
    marginTop: 12,
    color: colors.white,
    fontFamily: 'Sora_700Bold',
    fontSize: 22,
    lineHeight: 28,
  },
  treatmentText: {
    marginTop: 10,
    color: 'rgba(255,255,255,0.82)',
    fontFamily: 'Manrope_500Medium',
    fontSize: 15,
    lineHeight: 24,
  },
  chatScreen: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 32,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 24,
  },
  chatHeaderTitle: {
    flex: 1,
    alignItems: 'center',
  },
  chatHeaderName: {
    color: colors.text,
    fontFamily: 'Sora_700Bold',
    fontSize: 18,
  },
  chatHeaderRole: {
    color: colors.textMuted,
    fontFamily: 'Manrope_500Medium',
    fontSize: 15,
  },
  chatList: {
    paddingBottom: 24,
    gap: 18,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  messageRowLeft: {
    justifyContent: 'flex-start',
  },
  messageRowRight: {
    justifyContent: 'flex-end',
  },
  messageAvatar: {
    width: 48,
    height: 48,
    borderRadius: radii.pill,
  },
  messageBubble: {
    maxWidth: '72%',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderRadius: 28,
  },
  messageBubblePatient: {
    backgroundColor: '#DCEFF2',
  },
  messageBubbleDoctor: {
    backgroundColor: colors.sage,
  },
  messageText: {
    color: colors.text,
    fontFamily: 'Manrope_500Medium',
    fontSize: 17,
    lineHeight: 28,
  },
  messageTextDoctor: {
    color: colors.white,
  },
  composerShell: {
    marginTop: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  composerInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    paddingLeft: 22,
    paddingRight: 8,
    minHeight: 72,
    ...shadows.card,
  },
  composerInput: {
    flex: 1,
    color: colors.text,
    fontFamily: 'Manrope_500Medium',
    fontSize: 18,
  },
  cameraButton: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButton: {
    width: 72,
    height: 72,
    borderRadius: radii.pill,
    backgroundColor: colors.sage,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.button,
  },
  profileCard: {
    overflow: 'hidden',
    borderRadius: 34,
    backgroundColor: colors.white,
    marginBottom: 24,
    ...shadows.card,
  },
  profileGradient: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 26,
    paddingBottom: 30,
  },
  profileImage: {
    width: 108,
    height: 108,
    borderRadius: radii.pill,
    marginTop: 20,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  profileName: {
    marginTop: 16,
    color: colors.white,
    fontFamily: 'Sora_700Bold',
    fontSize: 24,
  },
  profileRole: {
    marginTop: 6,
    color: 'rgba(255,255,255,0.82)',
    fontFamily: 'Manrope_500Medium',
    fontSize: 15,
  },
  profileMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    padding: 20,
  },
  profileMetric: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  profileMetricValue: {
    color: colors.text,
    fontFamily: 'Sora_700Bold',
    fontSize: 22,
  },
  profileMetricLabel: {
    marginTop: 4,
    color: colors.textMuted,
    fontFamily: 'Manrope_500Medium',
    fontSize: 14,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderRadius: 24,
    backgroundColor: colors.white,
    marginBottom: 14,
    ...shadows.card,
  },
  settingLabel: {
    flex: 1,
    color: colors.text,
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 15,
  },
  logoutButton: {
    marginTop: 10,
    marginBottom: 24,
    minHeight: 56,
    borderRadius: radii.pill,
    backgroundColor: colors.primaryDeep,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.button,
  },
  logoutButtonText: {
    color: colors.white,
    fontFamily: 'Manrope_700Bold',
    fontSize: 15,
  },
  tabBar: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(223, 239, 236, 0.96)',
    ...shadows.card,
  },
  tabItem: {
    width: 64,
    height: 64,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabItemActive: {
    flexDirection: 'row',
    width: 148,
    gap: 10,
    backgroundColor: colors.sage,
  },
  tabLabelActive: {
    color: colors.white,
    fontFamily: 'Manrope_700Bold',
    fontSize: 17,
  },
});
