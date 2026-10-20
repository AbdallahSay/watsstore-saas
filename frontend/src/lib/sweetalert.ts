import Swal, { SweetAlertOptions } from 'sweetalert2';

/**
 * Helper to determine current theme mode from document or storage
 */
export function isDarkMode(): boolean {
  if (typeof document !== 'undefined') {
    if (document.documentElement.classList.contains('dark')) {
      return true;
    }
  }
  if (typeof localStorage !== 'undefined') {
    try {
      const savedTheme = localStorage.getItem('watsstore_theme');
      if (savedTheme === 'dark') return true;
      if (savedTheme === 'light') return false;
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {}
  }
  return false;
}

/**
 * Helper to get current text direction
 */
export function getCurrentDir(): 'rtl' | 'ltr' {
  if (typeof document !== 'undefined') {
    return (document.documentElement.dir as 'rtl' | 'ltr') || 'rtl';
  }
  return 'rtl';
}

/**
 * Returns theme-aware SweetAlert default options
 */
export function getThemeSwalConfig(): SweetAlertOptions {
  const dark = isDarkMode();

  return {
    background: dark ? '#0f172a' : '#ffffff',
    color: dark ? '#f8fafc' : '#0f172a',
    confirmButtonColor: '#10b981',
    cancelButtonColor: dark ? '#334155' : '#94a3b8',
    customClass: {
      popup: dark ? 'swal2-dark-popup border border-slate-700 shadow-2xl' : 'swal2-light-popup border border-slate-200 shadow-xl',
      title: dark ? 'text-slate-100 font-bold' : 'text-slate-900 font-bold',
      htmlContainer: dark ? 'text-slate-300' : 'text-slate-600',
      confirmButton: 'px-5 py-2.5 rounded-xl font-bold text-white shadow-md shadow-emerald-500/20',
      cancelButton: dark ? 'px-5 py-2.5 rounded-xl font-bold text-slate-200 bg-slate-800 border border-slate-700' : 'px-5 py-2.5 rounded-xl font-bold text-slate-700 bg-slate-100 border border-slate-300',
    },
    buttonsStyling: true,
  };
}

/**
 * Dynamic SweetAlert wrapper that always recalculates theme & direction
 */
export const appSwal = {
  fire: (options: SweetAlertOptions) => {
    return Swal.mixin(getThemeSwalConfig()).fire(options);
  },

  toast: (title: string, icon: 'success' | 'error' | 'warning' | 'info' = 'success', timer = 2500) => {
    const dark = isDarkMode();
    return Swal.fire({
      toast: true,
      position: getCurrentDir() === 'rtl' ? 'top-start' : 'top-end',
      icon,
      title,
      showConfirmButton: false,
      timer,
      timerProgressBar: true,
      background: dark ? '#1e293b' : '#ffffff',
      color: dark ? '#f8fafc' : '#0f172a',
      customClass: {
        popup: dark ? 'border border-slate-700 shadow-xl' : 'border border-slate-200 shadow-lg',
      },
    });
  },

  confirm: (
    title: string,
    text: string,
    confirmButtonText = 'تأكيد',
    cancelButtonText = 'إلغاء'
  ) => {
    return Swal.mixin(getThemeSwalConfig()).fire({
      title,
      text,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText,
      cancelButtonText,
      reverseButtons: getCurrentDir() === 'rtl',
    });
  },

  success: (title: string, text?: string) => {
    return appSwal.fire({
      icon: 'success',
      title,
      text,
    });
  },

  error: (title: string, text?: string) => {
    return appSwal.fire({
      icon: 'error',
      title,
      text,
    });
  },

  warning: (title: string, text?: string) => {
    return appSwal.fire({
      icon: 'warning',
      title,
      text,
    });
  },
};

export default appSwal;
