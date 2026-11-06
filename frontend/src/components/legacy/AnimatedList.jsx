import { motion } from 'framer-motion';

const listVariants = {
  animate: { transition: { staggerChildren: 0.06 } },
};

const AnimatedList = ({ children, className }) => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <motion.div
      variants={listVariants}
      initial="initial"
      animate="animate"
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedList;
