import React, { useState } from 'react';
import { useLanguageSimple } from '../hooks/useLanguageSimple';
import styles from './AlertDialog.module.css';

/**
 * AlertDialog Component
 * Modal dialog for setting price alerts on stocks
 */
export default function AlertDialog({ ticker, price, decision, onClose, onSetAlert }) {
  const { t } = useLanguageSimple();
  const [alertType, setAlertType] = useState('above');
  const [targetPrice, setTargetPrice] = useState(price ? (price * 1.1).toFixed(2) : '');
  const [loading, setLoading] = useState(false);

  const handleSetAlert = async () => {
    if (!targetPrice || targetPrice <= 0) {
      alert(t('enterValidPrice') || 'Please enter a valid price');
      return;
    }

    setLoading(true);
    try {
      const alertData = {
        ticker,
        currentPrice: price,
        targetPrice: parseFloat(targetPrice),
        alertType, // 'above' or 'below'
        createdAt: new Date().toISOString()
      };

      // Call parent handler
      if (onSetAlert) {
        await onSetAlert(alertData);
      }

      alert(`✅ ${t('alertSet') || 'Alert set'} for ${ticker} at ${targetPrice} EGP`);
      onClose();
    } catch (error) {
      console.error('Error setting alert:', error);
      alert(`❌ ${t('failedToSetAlert') || 'Failed to set alert'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <h2>{t('setNewAlert') || 'Set Price Alert'}</h2>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* Content */}
        <div className={styles.content}>
          {/* Stock Info Box */}
          <div className={styles.infoBox}>
            <div className={styles.infoRow}>
              <span className={styles.label}>{t('stock') || 'Stock'}:</span>
              <strong>{ticker}</strong>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.label}>{t('currentPrice') || 'Current Price'}:</span>
              <strong>{price ? `${price.toFixed(2)} EGP` : 'N/A'}</strong>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.label}>{t('recommendation') || 'Recommendation'}:</span>
              <strong className={styles[`rec_${decision?.finalDecision?.toLowerCase() || 'hold'}`]}>
                {decision?.finalDecision || 'HOLD'}
              </strong>
            </div>
          </div>

          {/* Alert Settings */}
          <div className={styles.settingsGroup}>
            {/* Alert Type Selection */}
            <div className={styles.formGroup}>
              <label>{t('alertWhen') || 'Alert When?'}</label>
              <div className={styles.radioGroup}>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    value="above"
                    checked={alertType === 'above'}
                    onChange={(e) => setAlertType(e.target.value)}
                  />
                  <span>{t('priceAbove') || 'Price goes above'}</span>
                </label>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    value="below"
                    checked={alertType === 'below'}
                    onChange={(e) => setAlertType(e.target.value)}
                  />
                  <span>{t('priceBelow') || 'Price goes below'}</span>
                </label>
              </div>
            </div>

            {/* Target Price Input */}
            <div className={styles.formGroup}>
              <label>{t('targetPrice') || 'Target Price'} (EGP)</label>
              <input
                type="number"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                placeholder={t('enterPrice') || 'Enter price...'}
                step="0.01"
                min="0"
                className={styles.input}
              />
            </div>

            {/* Price Suggestion */}
            <div className={styles.suggestion}>
              <p>{t('suggestedPrice') || 'Suggested prices'}:</p>
              <button
                className={styles.suggestionBtn}
                onClick={() => setTargetPrice((price * 1.05).toFixed(2))}
              >
                +5% ({(price * 1.05).toFixed(2)})
              </button>
              <button
                className={styles.suggestionBtn}
                onClick={() => setTargetPrice((price * 1.1).toFixed(2))}
              >
                +10% ({(price * 1.1).toFixed(2)})
              </button>
              <button
                className={styles.suggestionBtn}
                onClick={() => setTargetPrice((price * 0.95).toFixed(2))}
              >
                -5% ({(price * 0.95).toFixed(2)})
              </button>
              <button
                className={styles.suggestionBtn}
                onClick={() => setTargetPrice((price * 0.9).toFixed(2))}
              >
                -10% ({(price * 0.9).toFixed(2)})
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button
            className={styles.cancelBtn}
            onClick={onClose}
            disabled={loading}
          >
            {t('cancel') || 'Cancel'}
          </button>
          <button
            className={styles.setAlertBtn}
            onClick={handleSetAlert}
            disabled={loading || !targetPrice}
          >
            {loading ? t('setting') || 'Setting...' : (t('setAlert') || 'Set Alert')}
          </button>
        </div>
      </div>
    </div>
  );
}
