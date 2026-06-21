/**
 * Settings Panel Component
 *
 * Provides settings and data management features:
 * - Export game progress
 * - Import game progress from backup
 * - Sound settings
 * - Language toggle
 */

import { useState, useCallback } from 'react';
import { Download, Upload, RotateCcw, Settings, X, Check, AlertTriangle } from 'lucide-react';
import { useTranslation } from '../i18n';
import { getTelegramUserId } from '../lib/telegram';
import { getRawInitData } from '../lib/telegram';
import { showSuccess, showError, showWarning } from '../lib/errors';

interface SettingsPanelProps {
  onClose: () => void;
  onImportSuccess?: () => void;
}

interface BackupData {
  version: string;
  game_id: string;
  telegram_id?: number;
  game_progress?: Record<string, unknown>;
  exported_at?: string;
}

export function SettingsPanel({ onClose, onImportSuccess }: SettingsPanelProps) {
  const { t, toggleLocale, locale } = useTranslation();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showConfirmImport, setShowConfirmImport] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const telegramId = getTelegramUserId();

  // =====================================================
  // Export Progress
  // =====================================================
  const handleExport = useCallback(async () => {
    if (!telegramId) {
      showError('Користувач не авторизований');
      return;
    }

    setIsExporting(true);
    try {
      const initData = getRawInitData();
      if (!initData) {
        showError('Не вдалося отримати дані авторизації');
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/export-progress`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ initData }),
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || `Export failed: ${response.status}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `jolt-time-backup-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showSuccess('Прогрес експортовано!');
    } catch (err) {
      console.error('Export failed:', err);
      showError(`Помилка експорту: ${(err as Error).message}`);
    } finally {
      setIsExporting(false);
    }
  }, [telegramId]);

  // =====================================================
  // Import Progress
  // =====================================================
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showError('Файл занадто великий (макс. 5MB)');
      return;
    }

    // Check file type
    if (!file.name.endsWith('.json')) {
      showError('Неправильний формат файлу');
      return;
    }

    setPendingFile(file);
    setShowConfirmImport(true);
  }, []);

  const handleImportConfirm = useCallback(async () => {
    if (!pendingFile || !telegramId) {
      showError('Помилка імпорту');
      return;
    }

    setIsImporting(true);
    try {
      const text = await pendingFile.text();
      const backup: BackupData = JSON.parse(text);

      // Validate basic structure
      if (!backup.version || !backup.game_progress) {
        throw new Error('Неправильна структура файлу резервної копії');
      }

      if (backup.game_id !== 'ukraine-tap') {
        throw new Error('Файл від іншої гри');
      }

      const initData = getRawInitData();
      if (!initData) {
        throw new Error('Не вдалося отримати дані авторизації');
      }

      // Send to server
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/import-progress`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ initData, backup }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Імпорт невдалий');
      }

      showSuccess(`Прогрес відновлено! (${result.restored_tables?.join(', ')})`);

      // Close panel and reload
      setShowConfirmImport(false);
      setPendingFile(null);
      onImportSuccess?.();
      onClose();

      // Small delay before reload to show success message
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      console.error('Import failed:', err);
      showError(`Помилка імпорту: ${(err as Error).message}`);
    } finally {
      setIsImporting(false);
    }
  }, [pendingFile, telegramId, onImportSuccess, onClose]);

  const handleImportCancel = useCallback(() => {
    setShowConfirmImport(false);
    setPendingFile(null);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-sm mx-4 bg-[#161B22] rounded-2xl overflow-hidden border border-white/10">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#FFD700]" />
            <h2 className="text-lg font-semibold text-white">{t('settings.title') || 'Налаштування'}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#8B949E] hover:text-white transition-colors rounded-lg hover:bg-white/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Export Section */}
          <div className="bg-white/5 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-white font-medium">
              <Download className="w-4 h-4 text-[#10B981]" />
              {t('settings.export') || 'Експорт прогресу'}
            </div>
            <p className="text-sm text-[#8B949E]">
              {t('settings.export_desc') || 'Зберегти резервну копію вашого прогресу'}
            </p>
            <button
              onClick={handleExport}
              disabled={isExporting || !telegramId}
              className="w-full py-2.5 px-4 bg-[#10B981] hover:bg-[#0EA472] disabled:bg-white/10 disabled:text-[#8B949E] text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {isExporting ? (
                <>
                  <RotateCcw className="w-4 h-4 animate-spin" />
                  {t('settings.exporting') || 'Експорт...'}
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  {t('settings.export_btn') || 'Експортувати'}
                </>
              )}
            </button>
          </div>

          {/* Import Section */}
          <div className="bg-white/5 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-white font-medium">
              <Upload className="w-4 h-4 text-[#3B82F6]" />
              {t('settings.import') || 'Імпорт прогресу'}
            </div>
            <p className="text-sm text-[#8B949E]">
              {t('settings.import_desc') || 'Відновити прогрес з резервної копії'}
            </p>
            <label className="block">
              <input
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                disabled={isImporting || !telegramId}
                className="hidden"
              />
              <div className="w-full py-2.5 px-4 bg-[#3B82F6] hover:bg-[#2563EB] disabled:bg-white/10 disabled:text-[#8B949E] text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer">
                {isImporting ? (
                  <>
                    <RotateCcw className="w-4 h-4 animate-spin" />
                    {t('settings.importing') || 'Імпорт...'}
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    {t('settings.import_btn') || 'Обрати файл'}
                  </>
                )}
              </div>
            </label>
          </div>

          {/* Language Toggle */}
          <div className="bg-white/5 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-white font-medium">
                {t('settings.language') || 'Мова'}
              </span>
              <button
                onClick={toggleLocale}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg transition-colors"
              >
                {locale === 'uk' ? 'English' : 'Українська'}
              </button>
            </div>
          </div>

          {/* Version Info */}
          <div className="text-center text-xs text-[#8B949E] pt-2">
            Jolt Time v1.8.0
          </div>
        </div>

        {/* Import Confirmation Modal */}
        {showConfirmImport && (
          <div className="absolute inset-0 bg-black/90 flex items-center justify-center p-4">
            <div className="bg-[#161B22] rounded-2xl p-6 max-w-xs w-full border border-white/10">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-[#F59E0B]/20 rounded-full">
                  <AlertTriangle className="w-6 h-6 text-[#F59E0B]" />
                </div>
                <h3 className="text-lg font-semibold text-white">
                  {t('settings.confirm_import') || 'Підтвердження'}
                </h3>
              </div>
              <p className="text-sm text-[#8B949E] mb-6">
                {t('settings.import_warning') || 'Це замінить ваш поточний прогрес! Ви впевнені?'}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleImportCancel}
                  disabled={isImporting}
                  className="flex-1 py-2.5 px-4 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition-colors"
                >
                  {t('common.cancel') || 'Скасувати'}
                </button>
                <button
                  onClick={handleImportConfirm}
                  disabled={isImporting}
                  className="flex-1 py-2.5 px-4 bg-[#EF4444] hover:bg-[#DC2626] disabled:bg-white/10 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {isImporting ? (
                    <RotateCcw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      {t('settings.confirm') || 'Підтвердити'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
