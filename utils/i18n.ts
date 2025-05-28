import { I18n } from 'i18n-js';
import * as Localization from 'expo-localization';

const i18n = new I18n({
  en: {
    common: {
      save: 'Save',
      cancel: 'Cancel',
      edit: 'Edit',
      delete: 'Delete',
    },
    profile: {
      editProfile: 'Edit Profile',
      changePicture: 'Change Picture',
      name: 'Name',
      email: 'Email',
    },
    settings: {
      title: 'Settings',
      darkMode: 'Dark Mode',
      notifications: 'Notifications',
      language: 'Language',
      sound: 'Sound',
    },
    // Add more translations
  },
  es: {
    common: {
      save: 'Guardar',
      cancel: 'Cancelar',
      edit: 'Editar',
      delete: 'Eliminar',
    },
    profile: {
      editProfile: 'Editar Perfil',
      changePicture: 'Cambiar Foto',
      name: 'Nombre',
      email: 'Correo',
    },
    settings: {
      title: 'Configuración',
      darkMode: 'Modo Oscuro',
      notifications: 'Notificaciones',
      language: 'Idioma',
      sound: 'Sonido',
    },
    // Add more translations
  },
  // Add more languages
});

i18n.locale = Localization.locale;
i18n.enableFallback = true;
i18n.defaultLocale = 'en';

export default i18n;