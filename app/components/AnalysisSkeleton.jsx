import React from 'react';
import { useLanguageSimple } from '../hooks/useLanguageSimple';
import styles from './AnalysisSkeleton.module.css';

/**
 * AnalysisSkeleton Component
 * Loading skeleton with animated placeholders
 */
export default function AnalysisSkeleton() {
  const { t } = useLanguageSimple();

  return (
    <div className={styles.skeleton}>
      {/* Decision Banner Skeleton */}
      <div className={`${styles.section} ${styles.bannerSkeleton}`}>
        <div className={styles.skeletonLine} style={{ width: '40%', height: '40px' }} />
        <div className={styles.skeletonLine} style={{ width: '100%', marginTop: '16px' }} />
      </div>

      {/* Executive Summary Skeleton */}
      <div className={`${styles.section} ${styles.summarySkeleton}`}>
        <div className={styles.skeletonLine} style={{ width: '30%', height: '20px' }} />
        <div className={styles.skeletonLine} style={{ width: '100%', marginTop: '12px' }} />
        <div className={styles.skeletonLine} style={{ width: '100%', marginTop: '12px' }} />
      </div>

      {/* Bull/Bear Cases Skeleton */}
      <div className={`${styles.section} ${styles.casesSkeleton}`}>
        <div style={{ flex: 1, marginRight: '12px' }}>
          <div className={styles.skeletonLine} style={{ width: '50%', height: '18px' }} />
          <div className={styles.skeletonLine} style={{ width: '100%', marginTop: '12px' }} />
          <div className={styles.skeletonLine} style={{ width: '100%', marginTop: '12px' }} />
        </div>
        <div style={{ flex: 1 }}>
          <div className={styles.skeletonLine} style={{ width: '50%', height: '18px' }} />
          <div className={styles.skeletonLine} style={{ width: '100%', marginTop: '12px' }} />
          <div className={styles.skeletonLine} style={{ width: '100%', marginTop: '12px' }} />
        </div>
      </div>

      {/* Agent Cards Skeleton */}
      <div className={`${styles.section} ${styles.agentsSkeleton}`}>
        <div className={styles.skeletonLine} style={{ width: '20%', height: '20px' }} />
        <div className={styles.agentGrid}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={styles.skeletonCard}>
              <div className={styles.skeletonLine} style={{ width: '60%', height: '18px' }} />
              <div
                className={styles.skeletonLine}
                style={{ width: '100%', marginTop: '12px', height: '40px' }}
              />
            </div>
          ))}
        </div>
      </div>

      <div className={styles.loadingMessage}>
        <p>🤖 {t('analyzing')}</p>
        <div className={styles.dots}>
          <span>.</span>
          <span>.</span>
          <span>.</span>
        </div>
      </div>
    </div>
  );
}
