const AnimatedItem = ({ as: Tag = 'div', standalone: _standalone, className, children, ...props }) => (
  <Tag className={className} {...props}>
    {children}
  </Tag>
);

export default AnimatedItem;
