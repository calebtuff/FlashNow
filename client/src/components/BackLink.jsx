import { Link } from 'react-router-dom';
import Icon from './Icon.jsx';

export default function BackLink({ to, children }) {
  return (
    <Link
      to={to}
      className="legend inline-flex items-center gap-1.5 py-1 text-tick text-lume-faint no-underline transition-colors duration-jump hover:text-lume"
    >
      <Icon name="arrow_back" className="text-[16px]" />
      {children}
    </Link>
  );
}
