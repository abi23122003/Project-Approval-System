import React, { useEffect, useState } from 'react';
import { apiFetch, fetchAllPages } from '../../../utils/api';
import Button from '../../../components/ui/Button';
export default function PersonalNotifications() {
  const [items, setItems] = useState([]); const [error, setError] = useState(''); const [loading, setLoading] = useState(true);
  const load = async () => { setError(''); try { setItems(await fetchAllPages('/notifications/')); } catch (err) { setError(err.message); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  const markRead = async id => { try { await apiFetch('/notifications/', { method: 'PATCH', body: JSON.stringify({ id }) }); await load(); } catch (err) { setError(err.message); } };
  return <div className="space-y-3"><h2 className="font-semibold">Your notifications</h2>{error && <p role="alert">{error}<Button onClick={load}>Retry</Button></p>}{loading ? <p>Loading…</p> : items.length ? items.map(item => <article key={item.id} className="border-b py-3"><p>{item.message}</p><time>{new Date(item.created_at).toLocaleString()}</time>{!item.read_at && <Button onClick={() => markRead(item.id)}>Mark read</Button>}</article>) : <p>No notifications yet.</p>}</div>;
}
