import React, { useEffect, useRef, useState } from 'react';
import { apiFetch } from '../../../utils/api';
import Button from '../../../components/ui/Button';

export default function PersonalNotifications() {
  const [items, setItems] = useState([]);
  const [next, setNext] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [failedPage, setFailedPage] = useState(null);
  const inFlight = useRef(false);
  const load = async (path = '/notifications/', append = false) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setLoading(true); setError(''); setFailedPage(null);
    try {
      const page = await apiFetch(path);
      setItems(current => append ? [...current, ...page.results] : page.results);
      setNext(page.next);
    } catch (err) {
      setError(err.message);
      setFailedPage({ path, append });
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);
  const markRead = async id => {
    try {
      await apiFetch('/notifications/', { method: 'PATCH', body: JSON.stringify({ id }) });
      setItems(current => current.map(item => item.id === id ? { ...item, read_at: new Date().toISOString() } : item));
    } catch (err) { setError(err.message); }
  };
  return <div className="space-y-3">
    <h2 className="font-semibold">Your notifications</h2>
    {error && <p role="alert">{error}{failedPage && <Button disabled={loading} onClick={() => load(failedPage.path, failedPage.append)}>Retry</Button>}</p>}
    {items.map(item => <article key={item.id} className="border-b py-3"><p>{item.message}</p><time>{new Date(item.created_at).toLocaleString()}</time>{!item.read_at && <Button onClick={() => markRead(item.id)}>Mark read</Button>}</article>)}
    {loading ? <p>Loading…</p> : !error && !items.length && <p>No notifications yet.</p>}
    {next && <Button disabled={loading} onClick={() => load(next, true)}>Load more notifications</Button>}
  </div>;
}
