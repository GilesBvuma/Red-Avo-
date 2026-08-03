import './pos.css';

export const metadata = {
  title: 'Red Avo POS — Point of Sale',
  description: 'Red Avo internal point of sale system for staff.',
};

export default function POSLayout({ children }) {
  return (
    <div className="pos-root">
      {children}
    </div>
  );
}
