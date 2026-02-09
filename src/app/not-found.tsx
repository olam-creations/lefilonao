'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Search, FileText, ArrowRight, Trophy, RotateCcw, Sparkles } from 'lucide-react';
import Link from 'next/link';

const WORDS = [
  { word: 'MARCHE', hint: 'Contrat public' },
  { word: 'APPEL', hint: "D'offres, bien sur" },
  { word: 'CAHIER', hint: 'Des charges' },
  { word: 'CRITERE', hint: 'De selection' },
  { word: 'MEMOIRE', hint: 'Technique' },
  { word: 'CANDIDAT', hint: 'Celui qui repond' },
  { word: 'ALLOTI', hint: 'Divise en lots' },
  { word: 'DEMAT', hint: 'Dematerialisation' },
  { word: 'ACCORD', hint: 'Cadre' },
  { word: 'ACHETEUR', hint: 'Le donneur d\'ordre' },
  { word: 'ATTRIBUT', hint: '...ion du marche' },
  { word: 'OFFRE', hint: 'Proposition de prix' },
  { word: 'PUBLIE', hint: 'Rendu public au BOAMP' },
  { word: 'NOTATION', hint: 'Sur 20 chez nous' },
  { word: 'FILON', hint: 'Le bon plan... ou notre nom' },
];

const HANGMAN_STAGES = [
  // 0 errors
  `
   ┌───┐
   │   │
       │
       │
       │
  ═════╧═`,
  // 1
  `
   ┌───┐
   │   │
   O   │
       │
       │
  ═════╧═`,
  // 2
  `
   ┌───┐
   │   │
   O   │
   │   │
       │
  ═════╧═`,
  // 3
  `
   ┌───┐
   │   │
   O   │
  /│   │
       │
  ═════╧═`,
  // 4
  `
   ┌───┐
   │   │
   O   │
  /│\\  │
       │
  ═════╧═`,
  // 5
  `
   ┌───┐
   │   │
   O   │
  /│\\  │
  /    │
  ═════╧═`,
  // 6 - dead
  `
   ┌───┐
   │   │
   O   │
  /│\\  │
  / \\  │
  ═════╧═`,
];

const MAX_ERRORS = 6;
const REDIRECT_DELAY = 45;
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

function pickRandom() {
  return WORDS[Math.floor(Math.random() * WORDS.length)];
}

export default function NotFound() {
  const [redirectIn, setRedirectIn] = useState(REDIRECT_DELAY);
  const [paused, setPaused] = useState(false);

  const [current, setCurrent] = useState(pickRandom);
  const [guessed, setGuessed] = useState<Set<string>>(new Set());
  const [wins, setWins] = useState(0);
  const [streak, setStreak] = useState(0);

  const errors = [...guessed].filter((l) => !current.word.includes(l)).length;
  const isWon = current.word.split('').every((l) => guessed.has(l));
  const isLost = errors >= MAX_ERRORS;
  const display = current.word.split('').map((l) => (guessed.has(l) || isLost ? l : '_'));

  const handleGuess = useCallback(
    (letter: string) => {
      if (isWon || isLost || guessed.has(letter)) return;
      setPaused(true);
      setGuessed((prev) => new Set([...prev, letter]));
    },
    [isWon, isLost, guessed],
  );

  const handleNewWord = useCallback(() => {
    setCurrent(pickRandom());
    setGuessed(new Set());
  }, []);

  useEffect(() => {
    if (isWon) {
      setWins((w) => w + 1);
      setStreak((s) => s + 1);
    }
    if (isLost) {
      setStreak(0);
    }
  }, [isWon, isLost]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const key = e.key.toUpperCase();
      if (ALPHABET.includes(key)) {
        handleGuess(key);
      }
      if (e.key === 'Enter' && (isWon || isLost)) {
        handleNewWord();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleGuess, handleNewWord, isWon, isLost]);

  useEffect(() => {
    if (paused) return;
    if (redirectIn <= 0) {
      window.location.href = '/dashboard';
      return;
    }
    const timer = setTimeout(() => setRedirectIn((r) => r - 1), 1000);
    return () => clearTimeout(timer);
  }, [redirectIn, paused]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-violet-50/30 flex flex-col items-center justify-center px-4 py-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <motion.p
          initial={{ scale: 0.5 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="text-8xl font-black bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent mb-3"
        >
          404
        </motion.p>
        <h1 className="text-xl font-bold text-slate-800 mb-1">
          Cette page n&apos;existe pas
        </h1>
        <p className="text-sm text-slate-500">
          Mais puisque vous etes la, un petit jeu ?
        </p>
      </motion.div>

      {/* Game Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="w-full max-w-lg bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200 shadow-lg p-6 mb-6"
      >
        {/* Score bar */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              {wins} victoire{wins !== 1 ? 's' : ''}
            </div>
            {streak > 1 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-1 text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {streak} d&apos;affilee !
              </motion.div>
            )}
          </div>
          <p className="text-xs text-slate-400">
            Indice : <span className="font-medium text-slate-600">{current.hint}</span>
          </p>
        </div>

        {/* Hangman + Word */}
        <div className="flex gap-6 items-center mb-5">
          <pre className="text-sm leading-tight font-mono text-slate-700 select-none flex-shrink-0">
            {HANGMAN_STAGES[Math.min(errors, MAX_ERRORS)]}
          </pre>
          <div className="flex-1 flex flex-col items-center gap-3">
            <div className="flex gap-2 flex-wrap justify-center">
              {display.map((letter, i) => (
                <motion.span
                  key={`${current.word}-${i}`}
                  initial={{ rotateX: 90 }}
                  animate={{ rotateX: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`w-9 h-11 flex items-center justify-center text-xl font-bold rounded-lg border-2 ${
                    letter === '_'
                      ? 'border-slate-300 text-transparent bg-slate-50'
                      : isLost && !guessed.has(letter)
                        ? 'border-red-300 text-red-600 bg-red-50'
                        : 'border-indigo-300 text-indigo-700 bg-indigo-50'
                  }`}
                >
                  {letter}
                </motion.span>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {isWon && (
                <motion.p
                  key="won"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-sm font-bold text-emerald-600"
                >
                  Bravo ! Vous avez trouve !
                </motion.p>
              )}
              {isLost && (
                <motion.p
                  key="lost"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-sm font-bold text-red-500"
                >
                  Perdu ! Le mot etait : {current.word}
                </motion.p>
              )}
            </AnimatePresence>

            {(isWon || isLost) && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={handleNewWord}
                className="flex items-center gap-1.5 text-xs font-medium text-white bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2 rounded-lg hover:shadow-md transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Nouveau mot
              </motion.button>
            )}
          </div>
        </div>

        {/* Keyboard */}
        <div className="flex flex-wrap gap-1.5 justify-center">
          {ALPHABET.map((letter) => {
            const isGuessed = guessed.has(letter);
            const isCorrect = isGuessed && current.word.includes(letter);
            const isWrong = isGuessed && !current.word.includes(letter);

            return (
              <button
                key={letter}
                onClick={() => handleGuess(letter)}
                disabled={isGuessed || isWon || isLost}
                className={`w-8 h-8 text-xs font-bold rounded-lg transition-all ${
                  isCorrect
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                    : isWrong
                      ? 'bg-red-50 text-red-300 border border-red-200'
                      : 'bg-white text-slate-700 border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600'
                } disabled:cursor-default`}
              >
                {letter}
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Quick links */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex flex-wrap gap-3 justify-center mb-6"
      >
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 px-4 py-2.5 rounded-xl hover:border-indigo-300 hover:text-indigo-600 transition-all"
        >
          <Home className="w-4 h-4" /> Tableau de bord
        </Link>
        <Link
          href="/dashboard/market"
          className="flex items-center gap-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 px-4 py-2.5 rounded-xl hover:border-indigo-300 hover:text-indigo-600 transition-all"
        >
          <Search className="w-4 h-4" /> Veille marche
        </Link>
        <Link
          href="/dashboard/profile"
          className="flex items-center gap-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 px-4 py-2.5 rounded-xl hover:border-indigo-300 hover:text-indigo-600 transition-all"
        >
          <FileText className="w-4 h-4" /> Mon profil
        </Link>
      </motion.div>

      {/* Redirect countdown */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-center"
      >
        {paused ? (
          <button
            onClick={() => { setPaused(false); setRedirectIn(REDIRECT_DELAY); }}
            className="flex items-center gap-1.5 text-xs text-indigo-500 hover:text-indigo-700 font-medium transition-colors"
          >
            <ArrowRight className="w-3.5 h-3.5" /> Retour au tableau de bord
          </button>
        ) : (
          <p className="text-xs text-slate-400">
            Redirection dans <span className="font-mono font-bold text-slate-600">{redirectIn}s</span>
            {' '}
            <span className="text-slate-300">|</span>
            {' '}
            <button
              onClick={() => { window.location.href = '/dashboard'; }}
              className="text-indigo-500 hover:text-indigo-700 font-medium transition-colors"
            >
              y aller maintenant
            </button>
          </p>
        )}
      </motion.div>
    </div>
  );
}
