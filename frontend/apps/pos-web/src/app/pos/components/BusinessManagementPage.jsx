'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../AuthProvider';
import { registerEmployee } from '@red-avo/api-client';
import * as api from '../lib/api';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

const generateSparklineData = (base, variance) => {
  return Array.from({ length: 7 }).map(() => ({
    value: Math.max(0, base + (Math.random() * variance - (variance / 2)))
  }));
};

function Sparkline({ color, data }) {
  return (
    <div style={{ height: '40px', width: '100%', marginTop: '12px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={3} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

const SparklineWrapper = ({ color, base, variance }) => {
  const data = useMemo(() => generateSparklineData(base, variance), [base, variance]);
  return <Sparkline color={color} data={data} />;
};

export default function BusinessManagementPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('stores');
  const [stores, setStores] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [employeeStatsMap, setEmployeeStatsMap] = useState({});
  const [storeDashboards, setStoreDashboards] = useState({});

  // Employee Form State
  const [formData, setFormData] = useState({ fullName: '', email: '', phoneNumber: '', password: '', confirmPassword: '', storeId: '' });
  
  // Store Form State
  const [storeData, setStoreData] = useState({ name: '', location: '' });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modals state
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [showAddStoreModal, setShowAddStoreModal] = useState(false);
  const [passwordModal, setPasswordModal] = useState(null); // employee ID
  const [newPassword, setNewPassword] = useState('');
  
  // Performance Modal
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [recentSales, setRecentSales] = useState([]);
  const [loadingPerformance, setLoadingPerformance] = useState(false);

  // User Details Modal
  const [selectedUserDetail, setSelectedUserDetail] = useState(null);
  const [userTransfers, setUserTransfers] = useState([]);
  const [loadingTransfers, setLoadingTransfers] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ newPassword: '', confirm: '' });
  const [passwordStatus, setPasswordStatus] = useState('');

  const loadStores = useCallback(async () => {
    try {
      const s = await api.fetchStores();
      setStores(s);
      if (s.length > 0 && !formData.storeId) {
        setFormData(prev => ({ ...prev, storeId: s[0].id }));
      }
      // Load dashboards for stores
      const dashPromises = s.map(async (store) => {
          try {
              const dash = await api.fetchStoreDashboard(store.id);
              return { id: store.id, dash };
          } catch(e) { return null; }
      });
      const dashResults = await Promise.all(dashPromises);
      const dashMap = {};
      dashResults.forEach(r => { if (r) dashMap[r.id] = r.dash; });
      setStoreDashboards(dashMap);
    } catch (e) {
      console.error('Failed to load stores', e);
    }
  }, [formData.storeId]);

  const loadEmployees = useCallback(async () => {
    try {
      const emps = await api.fetchEmployees();
      setEmployees(emps);

      // Fetch stats for all employees concurrently
      const statsPromises = emps.map(async (emp) => {
        try {
           const stat = await api.fetchEmployeeStats(emp.id);
           return { id: emp.id, stat };
        } catch (e) {
           return { id: emp.id, stat: { totalOrders: 0, totalSales: 0, ordersToday: 0, salesToday: 0, salesThisMonth: 0, averageTransactionValue: 0 } };
        }
      });
      const statsResults = await Promise.all(statsPromises);
      const statsMap = {};
      statsResults.forEach(r => statsMap[r.id] = r.stat);
      setEmployeeStatsMap(statsMap);
    } catch (e) {
      console.error('Failed to load employees', e);
    }
  }, []);

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      loadStores();
      loadEmployees();
    }
  }, [user, loadStores, loadEmployees]);

  const handleEmpChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleStoreChange = (e) => setStoreData({ ...storeData, [e.target.name]: e.target.value });

  const handleRegisterEmployee = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) return setError('Passwords do not match');
    setLoading(true); setError(''); setSuccess('');
    try {
      await registerEmployee({ ...formData, storeId: parseInt(formData.storeId, 10) });
      setSuccess('Employee registered successfully!');
      setFormData({ ...formData, fullName: '', email: '', phoneNumber: '', password: '', confirmPassword: '' });
      setShowAddEmployeeModal(false);
      loadEmployees();
    } catch (err) { setError(err.message || 'Registration failed'); } 
    finally { setLoading(false); }
  };

  const handleCreateStore = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    try {
      await api.createStore(storeData);
      setSuccess('Store created successfully!');
      setStoreData({ name: '', location: '' });
      setShowAddStoreModal(false);
      loadStores();
    } catch (err) { setError(err.message || 'Failed to create store'); } 
    finally { setLoading(false); }
  };

  const openPerformanceModal = async (emp) => {
      setSelectedEmployee(emp);
      setLoadingPerformance(true);
      try {
          const sales = await api.fetchEmployeeRecentSales(emp.id);
          setRecentSales(sales);
      } catch (e) {
          console.error("Failed to load recent sales", e);
      } finally {
          setLoadingPerformance(false);
      }
  };

  const closePerformanceModal = () => {
      setSelectedEmployee(null);
      setRecentSales([]);
  };

  const openUserDetails = async (emp, e) => {
      e.stopPropagation();
      setSelectedUserDetail(emp);
      setLoadingTransfers(true);
      setPasswordStatus('');
      setPasswordForm({ newPassword: '', confirm: '' });
      try {
          const transfers = await api.fetchEmployeeTransfers(emp.id);
          setUserTransfers(transfers);
      } catch(err) {
          console.error(err);
      } finally {
          setLoadingTransfers(false);
      }
  };

  const closeUserDetails = () => {
      setSelectedUserDetail(null);
      setUserTransfers([]);
  };

  const handleChangePassword = async (e) => {
      e.preventDefault();
      if (passwordForm.newPassword !== passwordForm.confirm) {
          setPasswordStatus('Passwords do not match');
          return;
      }
      try {
          await api.changeEmployeePassword(selectedUserDetail.id, passwordForm.newPassword);
          setPasswordStatus('Password changed successfully');
          setPasswordForm({ newPassword: '', confirm: '' });
      } catch (err) {
          setPasswordStatus('Failed to change password');
      }
  };

  if (user?.role !== 'ADMIN') {
    return (
      <div className="pos-center" style={{ padding: '2rem' }}>
        <h2>Business Management</h2>
        <p>You do not have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="pos-center" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem', overflowY: 'auto', flex: 1, background: '#F5F5F5', position: 'relative' }}>
      <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>Business Management</h2>
      
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
        <button style={activeTab === 'stores' ? activeTabStyle : inactiveTabStyle} onClick={() => setActiveTab('stores')}>
          Store Dashboards
        </button>
        <button style={activeTab === 'employees' ? activeTabStyle : inactiveTabStyle} onClick={() => setActiveTab('employees')}>
          Employee Performance
        </button>
      </div>

      {error && <div style={{ color: '#e53e3e', background: '#fff5f5', padding: '0.8rem', borderRadius: '0.5rem', border: '1px solid #feb2b2' }}>{error}</div>}
      {success && <div style={{ color: '#38a169', background: '#f0fff4', padding: '0.8rem', borderRadius: '0.5rem', border: '1px solid #9ae6b4' }}>{success}</div>}

      {/* STORES TAB */}
      {activeTab === 'stores' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, color: '#2d3748', fontSize: '1.5rem' }}>Store KPIs</h3>
            <button onClick={() => setShowAddStoreModal(true)} style={{...primaryBtnStyle, marginTop: 0}}>+ Add New Store</button>
          </div>

          {stores.length === 0 ? (
            <p style={{ color: '#718096' }}>No stores found.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
              {stores.map(s => {
                  const dash = storeDashboards[s.id] || { revenueToday: 0, revenueThisMonth: 0, ordersToday: 0, ordersThisMonth: 0, leaderboard: [] };
                  return (
                      <div key={s.id} style={{ ...kpiCardStyle, padding: '1.5rem' }}>
                          <h4 style={{ margin: '0 0 1rem 0', fontSize: '18px', color: '#111827' }}>{s.name}</h4>
                          <span style={{ fontSize: '13px', color: '#6B7280', display: 'block', marginBottom: '1.5rem' }}>{s.location}</span>
                          
                          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                              <div style={{ flex: 1 }}>
                                  <div style={{ fontSize: '12px', color: '#6B7280', fontWeight: 600 }}>TODAY'S REVENUE</div>
                                  <div style={{ fontSize: '24px', fontWeight: 800, color: '#10B981' }}>${(dash.revenueToday || 0).toFixed(2)}</div>
                              </div>
                              <div style={{ flex: 1 }}>
                                  <div style={{ fontSize: '12px', color: '#6B7280', fontWeight: 600 }}>MONTH TO DATE</div>
                                  <div style={{ fontSize: '24px', fontWeight: 800, color: '#3B82F6' }}>${(dash.revenueThisMonth || 0).toFixed(2)}</div>
                              </div>
                          </div>
                          
                          <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '1rem' }}>
                              <h5 style={{ margin: '0 0 0.5rem 0', fontSize: '13px', color: '#4B5563' }}>Employee Leaderboard (Sales)</h5>
                              {dash.leaderboard.length === 0 ? (
                                  <span style={{ fontSize: '12px', color: '#9CA3AF' }}>No sales data yet</span>
                              ) : (
                                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                      {dash.leaderboard.map((lb, idx) => (
                                          <li key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F3F4F6', fontSize: '13px' }}>
                                              <span style={{ fontWeight: idx === 0 ? 700 : 500, color: idx === 0 ? '#D97706' : '#374151' }}>
                                                  {idx + 1}. {lb.employeeName}
                                              </span>
                                              <span style={{ fontWeight: 600, color: '#111827' }}>${(lb.sales || 0).toFixed(2)}</span>
                                          </li>
                                      ))}
                                  </ul>
                              )}
                          </div>
                      </div>
                  );
              })}
            </div>
          )}
        </div>
      )}

      {/* EMPLOYEES TAB */}
      {activeTab === 'employees' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: '0 0 1.5rem 0', color: '#2d3748', fontSize: '1.5rem' }}>Employee Performance</h3>
            <button onClick={() => setShowAddEmployeeModal(true)} style={{...primaryBtnStyle, marginTop: 0}}>+ Add Employee</button>
          </div>

          {employees.length === 0 ? (
            <p style={{ color: '#718096' }}>No employees found.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
              {employees.map(emp => {
                const stats = employeeStatsMap[emp.id] || { totalOrders: 0, totalSales: 0, ordersToday: 0, salesToday: 0 };
                return (
                  <div key={emp.id} 
                       className="pos-product-card" 
                       style={{ ...kpiCardStyle, padding: '1.5rem', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '2rem', cursor: 'pointer' }}
                       onClick={() => openPerformanceModal(emp)}>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, minWidth: '250px' }}>
                      <strong style={{ fontSize: '1.25rem', color: '#111827' }}>{emp.fullName} {emp.id === user?.id && '(You)'}</strong>
                      <span style={{ color: '#6B7280' }}>Role: {emp.role} {emp.storeId && `• ${stores.find(s => s.id === emp.storeId)?.name || 'Store ' + emp.storeId}`}</span>
                      <div>
                        <span style={{ display: 'inline-block', padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', background: emp.active ? '#ECFDF5' : '#FEF2F2', color: emp.active ? '#059669' : '#DC2626' }}>
                          {emp.active ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1.5rem', flex: 2, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                      <div style={{ ...kpiCardStyle, padding: '1.25rem', flex: '1 1 180px', maxWidth: '200px', boxShadow: 'none', border: '1px solid #E5E7EB' }}>
                        <div style={kpiHeaderStyle}><h4 style={kpiTitleStyle}>Today's Orders</h4></div>
                        <div style={{...kpiValueStyle, fontSize: '24px'}}>{stats.ordersToday || 0}</div>
                      </div>
                      <div style={{ ...kpiCardStyle, padding: '1.25rem', flex: '1 1 180px', maxWidth: '200px', boxShadow: 'none', border: '1px solid #E5E7EB' }}>
                        <div style={kpiHeaderStyle}><h4 style={kpiTitleStyle}>Today's Sales</h4></div>
                        <div style={{...kpiValueStyle, fontSize: '24px', color: '#10B981'}}>${(stats.salesToday || 0).toFixed(2)}</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                          <button style={{ ...actionBtnStyle('#F3F4F6'), color: '#374151', padding: '0.75rem 1rem', width: '100%' }}>View KPI &rarr;</button>
                          <button onClick={(e) => openUserDetails(emp, e)} style={{ ...actionBtnStyle('#E0E7FF'), color: '#3730A3', padding: '0.5rem 1rem', width: '100%', fontSize: '12px' }}>User Details &rarr;</button>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* PERFORMANCE MODAL */}
      {selectedEmployee && (
        <div style={modalOverlayStyle}>
          <div style={{ ...modalStyle, maxWidth: '800px', width: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '22px', fontWeight: 800 }}>Performance: {selectedEmployee.fullName}</h3>
              <button onClick={closePerformanceModal} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>&times;</button>
            </div>
            
            <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem' }}>
                {(() => {
                    const st = employeeStatsMap[selectedEmployee.id] || {};
                    const atv = st.averageTransactionValue || 0;
                    const monthSales = st.salesThisMonth || 0;
                    const target = 10000;
                    const progress = Math.min(100, (monthSales / target) * 100);
                    return (
                        <>
                            <div style={{ flex: 1, ...kpiCardStyle, padding: '1.25rem', border: '1px solid #E5E7EB', boxShadow: 'none' }}>
                                <div style={{ fontSize: '13px', color: '#6B7280', fontWeight: 600 }}>Avg Transaction Value (ATV)</div>
                                <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '8px' }}>${atv.toFixed(2)}</div>
                            </div>
                            <div style={{ flex: 2, ...kpiCardStyle, padding: '1.25rem', border: '1px solid #E5E7EB', boxShadow: 'none' }}>
                                <div style={{ fontSize: '13px', color: '#6B7280', fontWeight: 600 }}>Monthly Target Achievement</div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                                    <span style={{ fontSize: '28px', fontWeight: 800, color: '#3B82F6' }}>${monthSales.toFixed(2)}</span>
                                    <span style={{ fontSize: '16px', color: '#9CA3AF', alignSelf: 'flex-end', paddingBottom: '4px' }}>/ $10,000</span>
                                </div>
                                <div style={{ width: '100%', height: '8px', background: '#E5E7EB', borderRadius: '4px', marginTop: '12px', overflow: 'hidden' }}>
                                    <div style={{ width: `${progress}%`, height: '100%', background: progress >= 100 ? '#10B981' : '#3B82F6' }}></div>
                                </div>
                            </div>
                        </>
                    );
                })()}
            </div>

            <h4 style={{ fontSize: '16px', marginBottom: '1rem', color: '#374151' }}>Recent Transactions</h4>
            {loadingPerformance ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#6B7280' }}>Loading transactions...</div>
            ) : recentSales.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#6B7280' }}>No recent sales.</div>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                        <thead>
                            <tr style={{ background: '#F9FAFB', borderBottom: '2px solid #E5E7EB', textAlign: 'left' }}>
                                <th style={{ padding: '12px' }}>Order ID</th>
                                <th style={{ padding: '12px' }}>Date</th>
                                <th style={{ padding: '12px' }}>Customer</th>
                                <th style={{ padding: '12px' }}>Method</th>
                                <th style={{ padding: '12px', textAlign: 'right' }}>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentSales.map(order => (
                                <tr key={order.id} style={{ borderBottom: '1px solid #E5E7EB' }}>
                                    <td style={{ padding: '12px', fontWeight: 600 }}>#RA-{order.id}</td>
                                    <td style={{ padding: '12px', color: '#6B7280' }}>{new Date(order.createdAt).toLocaleString()}</td>
                                    <td style={{ padding: '12px' }}>{order.customerName || 'Walk-in'}</td>
                                    <td style={{ padding: '12px' }}>{order.paymentMethod}</td>
                                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600, color: '#10B981' }}>${order.total.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
          </div>
        </div>
      )}

      {/* USER DETAILS MODAL */}
      {selectedUserDetail && (
        <div style={modalOverlayStyle}>
          <div style={{ ...modalStyle, maxWidth: '600px', width: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>User Details</h3>
              <button onClick={closeUserDetails} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>&times;</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ ...kpiCardStyle, padding: '1.25rem', border: '1px solid #E5E7EB', boxShadow: 'none' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div><strong>Name:</strong> {selectedUserDetail.fullName}</div>
                        <div><strong>Email:</strong> {selectedUserDetail.email}</div>
                        <div><strong>Store:</strong> {selectedUserDetail.storeId ? (stores.find(s => s.id === selectedUserDetail.storeId)?.name || `Store ${selectedUserDetail.storeId}`) : 'None'}</div>
                    </div>
                </div>

                <div style={{ ...kpiCardStyle, padding: '1.25rem', border: '1px solid #E5E7EB', boxShadow: 'none' }}>
                    <h4 style={{ margin: '0 0 1rem 0' }}>Change Password</h4>
                    {passwordStatus && <div style={{ marginBottom: '1rem', color: passwordStatus.includes('success') ? '#10B981' : '#EF4444', fontSize: '13px', fontWeight: 600 }}>{passwordStatus}</div>}
                    <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <input type="password" placeholder="New Password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})} style={inputStyle} required />
                        <input type="password" placeholder="Confirm Password" value={passwordForm.confirm} onChange={(e) => setPasswordForm({...passwordForm, confirm: e.target.value})} style={inputStyle} required />
                        <button type="submit" style={{ ...primaryBtnStyle, marginTop: 0, alignSelf: 'flex-start', padding: '0.5rem 1.5rem' }}>Update Password</button>
                    </form>
                </div>

                <div style={{ ...kpiCardStyle, padding: '1.25rem', border: '1px solid #E5E7EB', boxShadow: 'none' }}>
                    <h4 style={{ margin: '0 0 1rem 0' }}>Transfer History</h4>
                    {loadingTransfers ? (
                        <div style={{ color: '#6B7280', fontSize: '14px' }}>Loading transfers...</div>
                    ) : userTransfers.length === 0 ? (
                        <div style={{ color: '#6B7280', fontSize: '14px' }}>No transfers requested by this user.</div>
                    ) : (
                        <div style={{ overflowX: 'auto', maxHeight: '250px' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                <thead>
                                    <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB', textAlign: 'left' }}>
                                        <th style={{ padding: '8px' }}>Date</th>
                                        <th style={{ padding: '8px' }}>Product Variant</th>
                                        <th style={{ padding: '8px' }}>Qty</th>
                                        <th style={{ padding: '8px' }}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {userTransfers.map(tr => (
                                        <tr key={tr.id} style={{ borderBottom: '1px solid #E5E7EB' }}>
                                            <td style={{ padding: '8px', color: '#6B7280' }}>{new Date(tr.requestedAt).toLocaleDateString()}</td>
                                            <td style={{ padding: '8px' }}>{tr.variant?.sku}</td>
                                            <td style={{ padding: '8px', fontWeight: 600 }}>{tr.requestedQuantity}</td>
                                            <td style={{ padding: '8px' }}>
                                                <span style={{ background: '#F3F4F6', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>{tr.status}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Store Modal */}
      {showAddStoreModal && (
        <div style={modalOverlayStyle}>
          <div style={{...modalStyle, maxWidth: '400px'}}>
            <h3 style={{ margin: '0 0 1.5rem 0', color: '#2d3748', fontSize: '20px', fontWeight: 800 }}>Create New Store</h3>
            <form onSubmit={handleCreateStore} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={labelStyle}>Store Name</label>
                <input type="text" name="name" value={storeData.name} onChange={handleStoreChange} required style={inputStyle} placeholder="e.g. Downtown Branch" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={labelStyle}>Location / Address</label>
                <input type="text" name="location" value={storeData.location} onChange={handleStoreChange} required style={inputStyle} placeholder="123 Main St, City" />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowAddStoreModal(false)} style={cancelBtnStyle}>Cancel</button>
                <button type="submit" disabled={loading} style={{ ...primaryBtnStyle, marginTop: 0, padding: '0.5rem 1rem' }}>
                  {loading ? 'Creating...' : 'Create Store'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Employee Modal */}
      {showAddEmployeeModal && (
        <div style={modalOverlayStyle}>
          <div style={{...modalStyle, maxWidth: '500px'}}>
            <h3 style={{ margin: '0 0 1.5rem 0', color: '#2d3748', fontSize: '20px', fontWeight: 800 }}>Register New Employee</h3>
            <form onSubmit={handleRegisterEmployee} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                  <label style={labelStyle}>Full Name</label>
                  <input type="text" name="fullName" value={formData.fullName} onChange={handleEmpChange} required style={inputStyle} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                  <label style={labelStyle}>Phone Number</label>
                  <input type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleEmpChange} required style={inputStyle} />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={labelStyle}>Email Address</label>
                <input type="email" name="email" value={formData.email} onChange={handleEmpChange} required style={inputStyle} />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                  <label style={labelStyle}>Password</label>
                  <input type="password" name="password" value={formData.password} onChange={handleEmpChange} required style={inputStyle} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                  <label style={labelStyle}>Confirm Password</label>
                  <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleEmpChange} required style={inputStyle} />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={labelStyle}>Assign to Store</label>
                <select name="storeId" value={formData.storeId} onChange={handleEmpChange} required style={inputStyle}>
                  <option value="" disabled>Select a store...</option>
                  {stores.map(s => (
                    <option key={s.id} value={s.id}>{s.name} - {s.location}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowAddEmployeeModal(false)} style={cancelBtnStyle}>Cancel</button>
                <button type="submit" disabled={loading} style={{ ...primaryBtnStyle, marginTop: 0, padding: '0.5rem 1rem' }}>
                  {loading ? 'Registering...' : 'Register Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const activeTabStyle = {
  padding: '0.5rem 1rem', background: '#111827', color: '#fff', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 'bold'
};
const inactiveTabStyle = {
  padding: '0.5rem 1rem', background: 'transparent', color: '#4a5568', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 'bold'
};
const labelStyle = { fontSize: '0.9rem', color: '#4a5568', fontWeight: 500 };
const inputStyle = { padding: '0.8rem', border: '1px solid #cbd5e0', borderRadius: '0.5rem', width: '100%', boxSizing: 'border-box' };
const primaryBtnStyle = { background: '#C0392B', color: '#fff', border: 'none', padding: '1rem', borderRadius: '0.5rem', fontWeight: 'bold', cursor: 'pointer', marginTop: '1rem' };
const actionBtnStyle = (color) => ({
  background: color, color: '#fff', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '0.25rem', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer'
});
const cancelBtnStyle = {
  background: '#EDF2F7', color: '#4A5568', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.25rem', fontWeight: 'bold', cursor: 'pointer'
};
const modalOverlayStyle = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
};
const modalStyle = {
  background: '#fff', padding: '2rem', borderRadius: '1rem', width: '100%', maxWidth: '400px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', maxHeight: '90vh', overflowY: 'auto'
};
const kpiCardStyle = {
  background: '#fff', borderRadius: '20px', padding: '24px', boxShadow: '0 10px 30px rgba(0,0,0,.05)', display: 'flex', flexDirection: 'column', border: 'none', transition: 'transform 0.2s ease, box-shadow 0.2s ease', cursor: 'default'
};
const kpiHeaderStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' };
const kpiTitleStyle = { margin: 0, fontSize: '15px', color: '#6B7280', fontWeight: 600, letterSpacing: '0.02em' };
const kpiValueStyle = { margin: 0, fontSize: '36px', fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' };
