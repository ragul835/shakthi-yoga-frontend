import re

with open('src/app/admin/page.tsx', 'r') as f:
    content = f.read()

passes_tab_jsx = """
          {/* ── Passes ── */}
          {activeTab === 'passes' && (
            <>
              <div className={styles.pageHeader}>
                <div className={styles.pageHeaderLeft}>
                  <h1 className={styles.pageTitle}>Class Passes</h1>
                  <p className={styles.pageSubtitle}>Manage pricing and pass options for students.</p>
                </div>
                <button className={styles.btnPrimary} onClick={() => setModalType('addPass')}>
                  + Create Pass Option
                </button>
              </div>
              <div className={styles.tableContainer}>
                {passOptionsLoading ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading passes...</div>
                ) : (
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Price (USD)</th>
                        <th>Total Classes</th>
                        <th>Validity (Days)</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {passOptions.length === 0 ? (
                        <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>No passes found.</td></tr>
                      ) : passOptions.map(p => (
                        <tr key={p.id}>
                          <td><strong>{p.name}</strong></td>
                          <td>${p.priceUsd}</td>
                          <td>{p.totalClasses ?? 'Unlimited'}</td>
                          <td>{p.validityDays ?? 'No Expiry'}</td>
                          <td>
                            <span className={`${styles.badge} ${p.isActive ? styles.badgeSuccess : styles.badgeFailed}`}>
                              {p.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td>
                            <button
                              className={`${styles.actionBtn} ${styles.btnEdit}`}
                              onClick={() => { setEditingPassOptionId(p.id); setModalType('editPass'); }}
                              style={{ marginRight: '8px' }}
                            >
                              Edit
                            </button>
                            <button
                              className={`${styles.actionBtn} ${styles.btnDelete}`}
                              onClick={() => { setItemToDelete({ id: p.id, type: 'pass' as any }); setModalType('confirmDelete'); }}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}
"""

if 'activeTab === \'passes\'' not in content:
    content = content.replace(
        "{/* ── Users ── */}",
        passes_tab_jsx + "\n          {/* ── Users ── */}"
    )

passes_modal_jsx = """
        {/* Pass Modal */}
        {(modalType === 'addPass' || modalType === 'editPass') && (
          <div className={styles.modalOverlay} onClick={closeModal}>
            <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
              <button className={styles.modalClose} onClick={closeModal}>✕</button>
              <h2 className={styles.modalTitle}>{modalType === 'addPass' ? 'Create Pass Option' : 'Edit Pass Option'}</h2>
              <form onSubmit={handleSaveModal}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Name</label>
                  <input type="text" name="name" className={styles.input} required defaultValue={editingPassOption?.name} placeholder="e.g. 3-Class Pass" />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Description</label>
                  <textarea name="description" className={styles.input} rows={2} defaultValue={editingPassOption?.description} placeholder="Short description..." />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Price ($)</label>
                    <input type="number" step="0.01" name="priceUsd" className={styles.input} required defaultValue={editingPassOption?.priceUsd} />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Total Classes</label>
                    <input type="number" name="totalClasses" className={styles.input} placeholder="Leave empty for unlimited" defaultValue={editingPassOption?.totalClasses} />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Validity (Days)</label>
                    <input type="number" name="validityDays" className={styles.input} placeholder="Leave empty for no expiry" defaultValue={editingPassOption?.validityDays} />
                  </div>
                </div>
                
                {modalType === 'editPass' && (
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Status</label>
                    <select name="isActive" className={styles.input} defaultValue={editingPassOption?.isActive ? 'true' : 'false'}>
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </div>
                )}
                
                <div className={styles.modalActions}>
                  <button type="button" className={styles.btnSecondary} onClick={closeModal}>Cancel</button>
                  <button type="submit" className={styles.btnPrimary} disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save Pass'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
"""

if 'modalType === \'addPass\'' not in content:
    content = content.replace(
        "{/* Add/Edit Class Modal */}",
        passes_modal_jsx + "\n        {/* Add/Edit Class Modal */}"
    )


with open('src/app/admin/page.tsx', 'w') as f:
    f.write(content)
print("Updated JSX")
