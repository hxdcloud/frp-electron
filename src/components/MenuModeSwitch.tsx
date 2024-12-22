import { Button } from 'antd';
import { useState } from 'react';
import { MenuModeEnum } from '@/constants';

export const MenuModeSwitch = () => {
  const [mode, setMode] = useState(
    localStorage.getItem('menuMode') || MenuModeEnum.SERVER,
  );

  const handleModeChange = () => {
    const newMode = mode === MenuModeEnum.CLIENT ? MenuModeEnum.SERVER : MenuModeEnum.CLIENT;
    localStorage.setItem('menuMode', newMode);
    setMode(newMode);
    window.location.reload(); // 刷新页面以更新菜单
  };

  return (
    <div style={{ marginRight: 24 }}>
      <Button onClick={handleModeChange} type="primary">
        {mode === MenuModeEnum.CLIENT ? '切换到服务端' : '切换到客户端'}
      </Button>
    </div>
  );
}; 