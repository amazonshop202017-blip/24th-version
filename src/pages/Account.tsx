import { Routes, Route, Navigate } from 'react-router-dom';
import { AccountLayout } from '@/components/account/AccountLayout';
import ProfilePage from './account/ProfilePage';
import SecurityPage from './account/SecurityPage';
import SubscriptionPage from './account/SubscriptionPage';

const Account = () => {
  return (
    <AccountLayout>
      <Routes>
        <Route path="profile" element={<ProfilePage />} />
        <Route path="security" element={<SecurityPage />} />
        <Route path="subscription" element={<SubscriptionPage />} />
        <Route path="*" element={<Navigate to="profile" replace />} />
      </Routes>
    </AccountLayout>
  );
};

export default Account;
