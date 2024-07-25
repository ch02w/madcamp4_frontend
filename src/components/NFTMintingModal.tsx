import React, { useState } from 'react';
import { minting } from '../services/mintingService';

interface NFTMintingModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
}

const NFTMintingModal: React.FC<NFTMintingModalProps> = ({isOpen, onClose, url}) => {
  const [walletKey, setWalletKey] = useState('');

  if (!isOpen) return null;

  const onConfirm = (walletKey: string) => {
    minting(url, walletKey);
    onClose();
  }

  return (
    <div className="nft-minting-modal" style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.8)',
      display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
    }}>
      <div style={{
        backgroundColor: '#2C2F33', padding: '30px', borderRadius: '10px', display: 'flex', flexDirection: 'column',
        alignItems: 'center', width: '350px', boxShadow: '0px 0px 15px rgba(0,0,0,0.5)'
      }}>
        <h2 style={{ color: '#FFFFFF', marginBottom: '20px', fontWeight: '600' }}>NFT Minting</h2>
        <input
          type="text"
          placeholder="Enter Kaikas wallet key"
          value={walletKey}
          onChange={(e) => setWalletKey(e.target.value)}
          style={{
            margin: '10px 0', padding: '10px', width: '100%', borderRadius: '5px', border: 'none',
            boxShadow: 'inset 0px 0px 5px rgba(0,0,0,0.2)', fontSize: '16px'
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
          <button onClick={onClose} style={{
            backgroundColor: 'gray', color: 'white', padding: '10px', borderRadius: '5px', flex: '1', margin: '0 5px',
            border: 'none', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold'
          }}>
            Cancel
          </button>
          <button onClick={() => onConfirm(walletKey)} style={{
            backgroundColor: '#483D8B', color: 'white', padding: '10px', borderRadius: '5px', flex: '1', margin: '0 5px',
            border: 'none', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold'
          }}>
            Confirm
          </button>
        </div>

      </div>
    </div>
  );
};

export default NFTMintingModal;
