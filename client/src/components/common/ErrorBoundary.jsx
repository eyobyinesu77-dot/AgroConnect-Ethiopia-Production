import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

function ErrorFallback({ onReset }) {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-red-50 text-center px-4">
      <span className="text-5xl mb-4">⚠️</span>
      <h1 className="text-2xl font-bold text-red-800 mb-2">{t('error_boundary_title')}</h1>
      <p className="text-gray-600 mb-6 max-w-md">{t('error_boundary_body')}</p>
      <button
        onClick={onReset}
        className="bg-red-700 hover:bg-red-800 text-white font-semibold px-5 py-2.5 rounded-lg"
      >
        {t('error_boundary_back_home')}
      </button>
    </div>
  );
}

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('AgroConnect UI error:', error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return <ErrorFallback onReset={this.handleReset} />;
    }

    return this.props.children;
  }
}
