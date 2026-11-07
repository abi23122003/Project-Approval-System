import React from 'react';
const label = value => value.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/_/g, ' ');
function Value({ value }) {
  if (Array.isArray(value)) return <ul className="list-disc pl-5">{value.map((item, index) => <li key={index}><Value value={item} /></li>)}</ul>;
  if (value && typeof value === 'object') return <dl>{Object.entries(value).filter(([key]) => key !== 'id').map(([key, item]) => <div key={key}><dt className="font-medium capitalize">{label(key)}</dt><dd><Value value={item} /></dd></div>)}</dl>;
  return <span className="whitespace-pre-wrap">{String(value ?? '')}</span>;
}
export default function ProposalDetails({ details = {} }) {
  return <div className="space-y-3">{Object.entries(details).filter(([, value]) => value != null && value !== '' && (!Array.isArray(value) || value.length)).map(([key, value]) => <section key={key}><h3 className="font-semibold capitalize">{label(key)}</h3><Value value={value} /></section>)}</div>;
}
