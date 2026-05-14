export default function Icon({ name, className = '' }) {
  return <span className={['material-symbols-outlined align-middle', className].join(' ')}>{name}</span>;
}
