import { motion } from 'framer-motion';

const ExitAnalyzer = () => {
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold tracking-tight">Exit Analyzer</h1>
        <p className="text-muted-foreground mt-1">Analyze your trade exits in detail</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card rounded-2xl p-12 flex flex-col items-center justify-center min-h-[400px]"
      >
        <p className="text-muted-foreground">Exit Analyzer content coming soon.</p>
      </motion.div>
    </div>
  );
};

export default ExitAnalyzer;
