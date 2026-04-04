import { useLocation } from 'react-router-dom';

const PageTransition = ({ children, className = '' }) => {
  const location = useLocation();

  return (
    <div key={location.pathname} className={`page-transition ${className}`.trim()}>
      {children}
    </div>
  );
};

export default PageTransition;
