import { motion } from 'framer-motion';

const itemVariants = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

const MotionTr = motion.tr;

const AnimatedItem = ({ children, className, as: tag = 'div', standalone = false }) => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduced) {
    if (tag === 'tr') return <tr className={className}>{children}</tr>;
    return <>{children}</>;
  }

  const ownProps = standalone ? { initial: 'initial', animate: 'animate' } : {};

  if (tag === 'tr') {
    return (
      <MotionTr variants={itemVariants} className={className} {...ownProps}>
        {children}
      </MotionTr>
    );
  }

  return (
    <motion.div variants={itemVariants} className={className} {...ownProps}>
      {children}
    </motion.div>
  );
};

export default AnimatedItem;
