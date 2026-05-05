import React, { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { useAccountSwitcher } from "../hooks/useAccountSwitcher";
import { useMultiSig } from "../hooks/useMultiSig";
import { CONTRACT_ADDRESS } from "../constants/contract";
import "./Dashboard.css";

/* ─── Micro SVG Icons ───────────────────────────────────────── */
const Icon = {
  overview:  () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>,
  ledger:    () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>,
  owners:    () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  plus:      () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  copy:      () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
  check:     () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  arrowUp:   () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>,
  arrowDown: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>,
  send:      () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  shield:    () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  x:         () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  spinner:   () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{animation:"spin .7s linear infinite"}}><path d="M12 2a10 10 0 0 1 10 10"/></svg>,
  chevronR:  () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>,
  wallet:    () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/><path d="M16 3H8L4 7h16l-4-4z"/><circle cx="17" cy="13" r="1" fill="currentColor"/></svg>,
};

/* ─── CopyButton ────────────────────────────────────────────── */
function CopyButton({ text, compact = false }) {
  const [state, setState] = useState("idle");
  const handleClick = () => {
    navigator.clipboard.writeText(text).then(() => {
      setState("copied");
      setTimeout(() => setState("idle"), 2000);
    });
  };
  return (
    <button className={`copy-btn${state === "copied" ? " copied" : ""}${compact ? " copy-btn--compact" : ""}`} onClick={handleClick}>
      {state === "copied" ? <><Icon.check />{!compact && " Copied"}</> : <><Icon.copy />{!compact && " Copy"}</>}
    </button>
  );
}

/* ─── Spinner btn helper ────────────────────────────────────── */
function Btn({ className, onClick, disabled, loading, success, children, successLabel, loadingLabel, type = "button" }) {
  return (
    <button type={type} className={`${className}${loading ? " btn--loading" : ""}${success ? " btn--success" : ""}`}
      onClick={onClick} disabled={disabled || loading}>
      {loading && <><Icon.spinner /> {loadingLabel || "Processing…"}</>}
      {!loading && success && <><Icon.check /> {successLabel || "Done"}</>}
      {!loading && !success && children}
    </button>
  );
}

/* ─── useActionState ────────────────────────────────────────── */
function useActionState(duration = 2200) {
  const [state, setState] = useState("idle");
  const run = useCallback(async (fn) => {
    setState("loading");
    const ok = await fn();
    if (ok !== false) { setState("success"); setTimeout(() => setState("idle"), duration); }
    else setState("idle");
  }, [duration]);
  return [state === "loading", state === "success", run];
}

/* ─── OverviewPage ──────────────────────────────────────────── */
function OverviewPage({ activeAccount, burners, burnerBalances, treasuryBalance, onFetch, onOpenNew, multiSig }) {
  const { depositETH } = multiSig;
  const [depositAmount, setDepositAmount] = useState("");
  const [depLoading, depSuccess, runDeposit] = useActionState();

  const handleDeposit = (e) => {
    e.preventDefault();
    if (!depositAmount) return;
    runDeposit(async () => {
      const ok = await depositETH(depositAmount);
      if (ok) { setDepositAmount(""); onFetch(); }
      return ok;
    });
  };

  const short = (addr) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  const activeIdx = burners.findIndex(b => b.address === activeAccount.address);
  const ownerNames = ["Owner 1", "Owner 2", "Owner 3"];

  return (
    <div className="page page--overview">
      {/* Hero */}
      <section className="hero-section">
        <div className="hero-left">
          <div className="hero-label">
            <span className="live-dot" />
            Treasury Balance
          </div>
          <div className="hero-amount">{parseFloat(treasuryBalance).toFixed(4)}<span className="hero-unit"> ETH</span></div>
          <p className="hero-sub">Managed by {burners.length} owners · 2 signatures required to execute</p>
          <button className="btn-blue btn-large" onClick={onOpenNew}>
            <Icon.send /> New Transaction
          </button>
        </div>

        <div className="deposit-card">
          <h3 className="deposit-card__title">Deposit Funds</h3>
          <div className="deposit-card__addr">
            <code className="addr-text">{short(CONTRACT_ADDRESS)}</code>
            <CopyButton text={CONTRACT_ADDRESS} compact />
          </div>
          <div className="deposit-card__qr">
            <div className="qr-placeholder">
              <Icon.wallet />
              <span>Wallet Address</span>
            </div>
          </div>
          <form onSubmit={handleDeposit} className="deposit-card__form">
            <input type="number" step="0.0001" placeholder="Amount in ETH" value={depositAmount}
              onChange={e => setDepositAmount(e.target.value)} disabled={depLoading} />
            <Btn type="submit" className="btn-blue btn-block" loading={depLoading} success={depSuccess}
              loadingLabel="Mining…" successLabel="Deposited!">
              Deposit ETH
            </Btn>
          </form>
        </div>
      </section>

      {/* Grid: Propose + Signers */}
      <section className="mid-grid">
        <ProposeCard multiSig={multiSig} onFetch={onFetch} disabled={depLoading} />

        <div className="card signers-card">
          <div className="card__header">
            <h3 className="card__title">Signer Wallets</h3>
            <span className="badge badge--neutral">2/3 Required</span>
          </div>
          <div className="signers-list">
            {burners.map((b, i) => {
              const isActive = b.address === activeAccount.address;
              return (
                <div key={i} className={`signer-row${isActive ? " signer-row--active" : ""}`}>
                  <div className="signer-avatar" style={{background: isActive ? "var(--blue)" : `hsl(${i*80},40%,82%)`}}>
                    {isActive ? ownerNames[i][0] : ownerNames[i][0]}
                    <span className={`signer-dot ${isActive ? "signer-dot--active" : ""}`} />
                  </div>
                  <div className="signer-info">
                    <div className="signer-name">{ownerNames[i]}{isActive && <span className="you-badge">You</span>}</div>
                    <code className="signer-addr">{short(b.address)}</code>
                  </div>
                  <CopyButton text={b.address} compact />
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

/* ─── ProposeCard ───────────────────────────────────────────── */
function ProposeCard({ multiSig, onFetch, disabled }) {
  const { submitTx } = multiSig;
  const [to, setTo] = useState("");
  const [amt, setAmt] = useState("");
  const [loading, success, run] = useActionState();

  const handle = (e) => {
    e.preventDefault();
    if (!to || !amt) return;
    run(async () => {
      const ok = await submitTx(to, amt);
      if (ok) { setTo(""); setAmt(""); onFetch(); }
      return ok;
    });
  };

  return (
    <div className="card propose-card">
      <div className="card__header">
        <h3 className="card__title"><Icon.send /> Propose Transaction</h3>
      </div>
      <form onSubmit={handle} className="propose-form">
        <div className="form-group">
          <label className="form-label">Recipient Address</label>
          <input type="text" placeholder="0x..." value={to} onChange={e => setTo(e.target.value)} disabled={loading || disabled} />
        </div>
        <div className="form-group">
          <label className="form-label">Amount (ETH)</label>
          <input type="number" step="0.0001" placeholder="0.00" value={amt} onChange={e => setAmt(e.target.value)} disabled={loading || disabled} />
        </div>
        <Btn type="submit" className="btn-dark btn-block" loading={loading} success={success}
          loadingLabel="Broadcasting…" successLabel="Proposed!">
          Review Proposal <Icon.chevronR />
        </Btn>
      </form>
    </div>
  );
}

/* ─── LedgerPage ────────────────────────────────────────────── */
function LedgerPage({ transactions, activeAccount, onConfirm, onExecute, onRevoke }) {
  const [filter, setFilter] = useState("all"); // all | pending | executed

  const filtered = transactions.filter(tx => {
    if (filter === "pending") return !tx.executed;
    if (filter === "executed") return tx.executed;
    return true;
  });

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title">Transaction Ledger</h2>
          <p className="page-sub">{transactions.length} total transactions on Sepolia</p>
        </div>
        <div className="filter-tabs">
          {["all","pending","executed"].map(f => (
            <button key={f} className={`filter-tab${filter === f ? " filter-tab--active" : ""}`} onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f !== "all" && <span className="filter-count">{transactions.filter(t => f==="pending" ? !t.executed : t.executed).length}</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="card ledger-card">
        {filtered.length === 0 ? (
          <div className="ledger-empty">
            <div className="ledger-empty__icon"><Icon.ledger /></div>
            <p>No {filter !== "all" ? filter : ""} transactions found.</p>
          </div>
        ) : (
          filtered.map(tx => (
            <TxRow key={tx.index} tx={tx} activeAccount={activeAccount}
              onConfirm={onConfirm} onExecute={onExecute} onRevoke={onRevoke} />
          ))
        )}
      </div>
    </div>
  );
}

/* ─── TxRow ─────────────────────────────────────────────────── */
function TxRow({ tx, activeAccount, onConfirm, onExecute, onRevoke }) {
  const isOwner = tx.owners.includes(activeAccount.address);
  const [confLoading, confSuccess, runConf] = useActionState();
  const [execLoading, execSuccess, runExec] = useActionState();
  const [revLoading, revSuccess, runRev]  = useActionState();

  const short = addr => `${addr.slice(0, 8)}…${addr.slice(-6)}`;
  const pct = Math.min((tx.numConfirmations / tx.confirmationsNeeded) * 100, 100);
  const isDeposit = tx.value && ethers.BigNumber.isBigNumber(tx.value) && tx.value.eq(0);

  return (
    <div className={`tx-row${tx.executed ? " tx-row--executed" : ""}`}>
      <div className="tx-row__icon">
        {tx.executed
          ? <div className="tx-icon tx-icon--success"><Icon.arrowDown /></div>
          : <div className="tx-icon tx-icon--pending"><Icon.arrowUp /></div>}
      </div>

      <div className="tx-row__body">
        <div className="tx-row__top">
          <div className="tx-row__title">
            {tx.executed ? "Send ETH" : "Send ETH"}
            {!tx.executed && (
              <span className="badge badge--orange">
                Needs Signatures ({tx.numConfirmations}/{tx.confirmationsNeeded})
              </span>
            )}
            {tx.executed && <span className="badge badge--green">Executed</span>}
          </div>
          <div className="tx-row__amount" style={{color: tx.executed ? "var(--text-secondary)" : "var(--text-primary)"}}>
            − {ethers.utils.formatEther(tx.value)} ETH
          </div>
        </div>

        <div className="tx-row__sub">
          <code className="tx-addr">To: {short(tx.to)}</code>
          {!tx.executed && (
            <div className="tx-progress">
              <div className="tx-progress__bar">
                <div className="tx-progress__fill" style={{width:`${pct}%`}} />
              </div>
              <span className="tx-progress__label">{tx.numConfirmations}/{tx.confirmationsNeeded}</span>
            </div>
          )}
        </div>

        {!tx.executed && isOwner && (
          <div className="tx-row__actions">
            {tx.isConfirmed ? (
              <Btn className="btn-ghost btn-sm btn-red" loading={revLoading} success={revSuccess}
                loadingLabel="Revoking…" successLabel="Revoked"
                onClick={() => runRev(async () => { await onRevoke(tx.index); return true; })}>
                Revoke
              </Btn>
            ) : (
              <Btn className="btn-blue btn-sm" loading={confLoading} success={confSuccess}
                loadingLabel="Signing…" successLabel="Signed!"
                onClick={() => runConf(async () => { await onConfirm(tx.index); return true; })}>
                Sign Now
              </Btn>
            )}
            {tx.canExecute && (
              <Btn className="btn-green btn-sm" loading={execLoading} success={execSuccess}
                loadingLabel="Executing…" successLabel="Done!"
                onClick={() => runExec(async () => { await onExecute(tx.index); return true; })}>
                Execute
              </Btn>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── OwnersPage ────────────────────────────────────────────── */
function OwnersPage({ burners, burnerBalances, activeAccount, onSwitch }) {
  const short = addr => `${addr.slice(0, 10)}…${addr.slice(-8)}`;
  const ownerNames = ["Owner 1", "Owner 2", "Owner 3"];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title">Signer Wallets</h2>
          <p className="page-sub">2 of 3 signatures required to execute any transaction</p>
        </div>
      </div>

      <div className="owners-info-bar">
        <div className="owners-stat">
          <span className="owners-stat__num">3</span>
          <span className="owners-stat__label">Total Owners</span>
        </div>
        <div className="owners-stat-divider" />
        <div className="owners-stat">
          <span className="owners-stat__num">2</span>
          <span className="owners-stat__label">Required Sigs</span>
        </div>
        <div className="owners-stat-divider" />
        <div className="owners-stat">
          <span className="owners-stat__num">67%</span>
          <span className="owners-stat__label">Threshold</span>
        </div>
      </div>

      <div className="card">
        {burners.map((b, i) => {
          const isActive = b.address === activeAccount.address;
          return (
            <div key={i} className={`owner-card-row${isActive ? " owner-card-row--active" : ""}`}>
              <div className="owner-card-row__avatar" style={{background: isActive ? "var(--blue)" : `hsl(${i*80+200},50%,85%)`}}>
                <span style={{color: isActive ? "#fff" : `hsl(${i*80+200},50%,35%)`, fontWeight:700}}>
                  {ownerNames[i][0]}{i+1}
                </span>
              </div>
              <div className="owner-card-row__info">
                <div className="owner-card-row__name">
                  {ownerNames[i]}
                  {isActive && <span className="you-badge">Acting as You</span>}
                </div>
                <code className="owner-card-row__addr">{short(b.address)}</code>
                <div className="owner-card-row__bal">
                  {parseFloat(burnerBalances[i]).toFixed(6)} ETH
                </div>
              </div>
              <div className="owner-card-row__actions">
                <CopyButton text={b.address} />
                {!isActive && (
                  <button className="btn-ghost btn-sm" onClick={() => onSwitch(i)}>
                    Switch to
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── NewTxModal ────────────────────────────────────────────── */
function NewTxModal({ onClose, multiSig, onFetch }) {
  const { submitTx } = multiSig;
  const [to, setTo] = useState("");
  const [amt, setAmt] = useState("");
  const [loading, success, run] = useActionState(1800);

  const handle = (e) => {
    e.preventDefault();
    if (!to || !amt) return;
    run(async () => {
      const ok = await submitTx(to, amt);
      if (ok) { setTo(""); setAmt(""); onFetch(); setTimeout(onClose, 1500); }
      return ok;
    });
  };

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal__header">
          <h3 className="modal__title">New Transaction</h3>
          <button className="modal__close" onClick={onClose}><Icon.x /></button>
        </div>
        <form onSubmit={handle} className="modal__body">
          <div className="form-group">
            <label className="form-label">Recipient Address</label>
            <input type="text" placeholder="0x..." value={to} onChange={e => setTo(e.target.value)} disabled={loading} />
          </div>
          <div className="form-group">
            <label className="form-label">Amount (ETH)</label>
            <div className="input-with-suffix">
              <input type="number" step="0.0001" placeholder="0.0000" value={amt}
                onChange={e => setAmt(e.target.value)} disabled={loading} />
              <span className="input-suffix">ETH</span>
            </div>
          </div>
          <div className="modal__note">
            <Icon.shield />
            This transaction will require 2 of 3 owner signatures before execution.
          </div>
          <Btn type="submit" className="btn-blue btn-block btn-large" loading={loading} success={success}
            loadingLabel="Broadcasting to Sepolia…" successLabel="Transaction Proposed!">
            Submit Proposal
          </Btn>
        </form>
      </div>
    </div>
  );
}

/* ─── Main Dashboard ────────────────────────────────────────── */
export default function Dashboard() {
  const { activeAccount, switchAccount, burners } = useAccountSwitcher();
  const multiSig = useMultiSig(activeAccount);
  const { getBalance, getTransactions, confirmTx, executeTx, revokeTx } = multiSig;

  const [page, setPage] = useState("overview");
  const [showModal, setShowModal] = useState(false);
  const [treasuryBalance, setTreasuryBalance] = useState("0.0");
  const [burnerBalances, setBurnerBalances] = useState(["0","0","0"]);
  const [transactions, setTransactions] = useState([]);
  const [fetching, setFetching] = useState(false);

  const fetchData = useCallback(async () => {
    if (!activeAccount) return;
    setFetching(true);
    const [tBal, b0, b1, b2, txs] = await Promise.all([
      getBalance(CONTRACT_ADDRESS),
      getBalance(burners[0].address),
      getBalance(burners[1].address),
      getBalance(burners[2].address),
      getTransactions(burners),
    ]);
    setTreasuryBalance(tBal);
    setBurnerBalances([b0,b1,b2]);
    setTransactions(txs);
    setFetching(false);
  }, [activeAccount, burners]);

  useEffect(() => { fetchData(); }, [activeAccount]);

  const handleConfirm = async (i) => { await confirmTx(i); fetchData(); };
  const handleExecute = async (i) => { await executeTx(i); fetchData(); };
  const handleRevoke  = async (i) => { await revokeTx(i);  fetchData(); };

  const navItems = [
    { id:"overview", label:"Overview",     Icon: Icon.overview },
    { id:"ledger",   label:"Ledger",       Icon: Icon.ledger,  badge: transactions.filter(t=>!t.executed).length || null },
    { id:"owners",   label:"Owners",       Icon: Icon.owners },
  ];

  const short = (addr) => `${addr.slice(0,6)}...${addr.slice(-4)}`;
  const ownerNames = ["Owner 1","Owner 2","Owner 3"];
  const activeIdx = burners.findIndex(b => b.address === activeAccount.address);

  return (
    <div className="app-shell">
      {/* ── Sidebar ──────────────────────────────────────── */}
      <aside className="sidebar">
        <div className="sidebar__brand">
          <div className="sidebar__logo"><Icon.wallet /></div>
          <div>
            <div className="sidebar__name">Main Treasury</div>
            <div className="sidebar__sub">Active MultiSig</div>
          </div>
        </div>

        <nav className="sidebar__nav">
          {navItems.map(item => (
            <button key={item.id} className={`nav-item${page===item.id ? " nav-item--active":""}`}
              onClick={() => setPage(item.id)}>
              <item.Icon />
              <span>{item.label}</span>
              {item.badge > 0 && <span className="nav-badge">{item.badge}</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar__footer">
          <button className="btn-blue btn-block" onClick={() => setShowModal(true)}>
            <Icon.plus /> New Transaction
          </button>

          {/* Account switcher */}
          <div className="account-switcher">
            <div className="account-switcher__label">Acting as</div>
            <select className="account-switcher__select"
              value={activeIdx}
              onChange={e => switchAccount(Number(e.target.value))}>
              {burners.map((b,i) => (
                <option key={i} value={i}>{ownerNames[i]} · {short(b.address)}</option>
              ))}
            </select>
          </div>
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────────── */}
      <main className="main-content">
        {/* Mobile topbar */}
        <div className="topbar">
          <div className="topbar__brand"><Icon.wallet /> MultiSig</div>
          <select className="topbar__switcher" value={activeIdx}
            onChange={e => switchAccount(Number(e.target.value))}>
            {burners.map((b,i)=><option key={i} value={i}>{ownerNames[i]}</option>)}
          </select>
        </div>

        {/* Mobile nav */}
        <div className="mobile-nav">
          {navItems.map(item=>(
            <button key={item.id} className={`mobile-nav-item${page===item.id?" mobile-nav-item--active":""}`}
              onClick={()=>setPage(item.id)}>
              <item.Icon />
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        {fetching && transactions.length === 0 && (
          <div className="loading-state">
            <Icon.spinner /> Loading wallet data…
          </div>
        )}

        {page === "overview" && (
          <OverviewPage
            activeAccount={activeAccount} burners={burners}
            burnerBalances={burnerBalances} treasuryBalance={treasuryBalance}
            onFetch={fetchData} onOpenNew={() => setShowModal(true)} multiSig={multiSig}
          />
        )}
        {page === "ledger" && (
          <LedgerPage transactions={transactions} activeAccount={activeAccount}
            onConfirm={handleConfirm} onExecute={handleExecute} onRevoke={handleRevoke} />
        )}
        {page === "owners" && (
          <OwnersPage burners={burners} burnerBalances={burnerBalances}
            activeAccount={activeAccount} onSwitch={switchAccount} />
        )}
      </main>

      {showModal && (
        <NewTxModal onClose={() => setShowModal(false)} multiSig={multiSig} onFetch={fetchData} />
      )}
    </div>
  );
}
