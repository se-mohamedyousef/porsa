import React, { useState } from 'react';
import { useLanguageSimple } from '../hooks/useLanguageSimple';
import styles from './TickerInputBar.module.css';

/**
 * TickerInputBar Component
 * Input field for entering stock ticker
 */
export default function TickerInputBar({ onAnalyze, disabled }) {
  const { t } = useLanguageSimple();
  const [ticker, setTicker] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (ticker.trim()) {
      onAnalyze(ticker);
      setTicker('');
    }
  };

  const handleChange = (e) => {
    setTicker(e.target.value.toUpperCase());
  };

  return (
    <form className={styles.inputBar} onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder={t('enterTicker')}
        value={ticker}
        onChange={handleChange}
        disabled={disabled}
        maxLength="10"
        className={styles.input}
      />
      <button type="submit" disabled={disabled || !ticker.trim()} className={styles.button}>
        {disabled ? t('analyzing') : t('analyze')}
      </button>
    </form>
  );
}
