// Profile avatars mapping
export const getProfileImage = (name: string): string => {
  const profileMap: Record<string, string> = {
    'Sarah Kelly': '/lovable-uploads/d1e58bb8-b58b-4795-b76e-d057f3f102c5.png',
    'John Kelly': '/lovable-uploads/a50e0c74-b5e7-4331-945d-b456fb48765b.png',
    'Laura Davis': '/lovable-uploads/85fbd059-f53e-48f2-9cb6-691d0c4ba899.png',
    'Eoin McGowan': '/lovable-uploads/379fa9c7-8b08-43d9-958a-2037e951a111.png',
    'David Doyle': '/lovable-uploads/2a629138-9746-40f3-ad13-33c9c4d4b180.png',
    'John Smith': '/lovable-uploads/d2129a8a-60b8-4d03-a7ae-afd36ae648c1.png',
    'Sarah Johnson': '/lovable-uploads/585eab8a-4417-41e5-9f7d-d353e3d174ba.png',
    'Mike Wilson': '/lovable-uploads/eb6c53a7-5a99-4a8d-84c6-821cea326843.png',
    'Emily Davis': '/lovable-uploads/85fbd059-f53e-48f2-9cb6-691d0c4ba899.png',
    'Jane Doe': '/lovable-uploads/585eab8a-4417-41e5-9f7d-d353e3d174ba.png',
    // Map additional names to cycle through available images
    'Mary Johnson': '/lovable-uploads/d1e58bb8-b58b-4795-b76e-d057f3f102c5.png',
    'David Wilson': '/lovable-uploads/2a629138-9746-40f3-ad13-33c9c4d4b180.png',
    'Sarah Brown': '/lovable-uploads/585eab8a-4417-41e5-9f7d-d353e3d174ba.png',
    'Michael Davis': '/lovable-uploads/eb6c53a7-5a99-4a8d-84c6-821cea326843.png',
    'Emma Wilson': '/lovable-uploads/85fbd059-f53e-48f2-9cb6-691d0c4ba899.png',
    'James Taylor': '/lovable-uploads/a50e0c74-b5e7-4331-945d-b456fb48765b.png',
    'Lisa Anderson': '/lovable-uploads/d1e58bb8-b58b-4795-b76e-d057f3f102c5.png',
    'Robert Thomas': '/lovable-uploads/379fa9c7-8b08-43d9-958a-2037e951a111.png',
    'Jennifer White': '/lovable-uploads/585eab8a-4417-41e5-9f7d-d353e3d174ba.png',
    'William Garcia': '/lovable-uploads/eb6c53a7-5a99-4a8d-84c6-821cea326843.png',
    'Elizabeth Martinez': '/lovable-uploads/d1e58bb8-b58b-4795-b76e-d057f3f102c5.png',
    'Christopher Rodriguez': '/lovable-uploads/2a629138-9746-40f3-ad13-33c9c4d4b180.png',
    'Amanda Lewis': '/lovable-uploads/85fbd059-f53e-48f2-9cb6-691d0c4ba899.png',
    'Matthew Walker': '/lovable-uploads/a50e0c74-b5e7-4331-945d-b456fb48765b.png',
    'Jessica Hall': '/lovable-uploads/585eab8a-4417-41e5-9f7d-d353e3d174ba.png',
    'Anthony Allen': '/lovable-uploads/379fa9c7-8b08-43d9-958a-2037e951a111.png',
    'Ashley Young': '/lovable-uploads/d1e58bb8-b58b-4795-b76e-d057f3f102c5.png',
    'Joshua King': '/lovable-uploads/eb6c53a7-5a99-4a8d-84c6-821cea326843.png',
    'Stephanie Wright': '/lovable-uploads/85fbd059-f53e-48f2-9cb6-691d0c4ba899.png',
    'Andrew Lopez': '/lovable-uploads/2a629138-9746-40f3-ad13-33c9c4d4b180.png',
    'Michelle Hill': '/lovable-uploads/d1e58bb8-b58b-4795-b76e-d057f3f102c5.png',
    'Daniel Scott': '/lovable-uploads/a50e0c74-b5e7-4331-945d-b456fb48765b.png',
    'Christina Green': '/lovable-uploads/585eab8a-4417-41e5-9f7d-d353e3d174ba.png',
    'Ryan Adams': '/lovable-uploads/379fa9c7-8b08-43d9-958a-2037e951a111.png',
    'Melissa Baker': '/lovable-uploads/85fbd059-f53e-48f2-9cb6-691d0c4ba899.png',
    'Brandon Gonzalez': '/lovable-uploads/eb6c53a7-5a99-4a8d-84c6-821cea326843.png',
    'Nicole Nelson': '/lovable-uploads/d1e58bb8-b58b-4795-b76e-d057f3f102c5.png',
    'Jason Carter': '/lovable-uploads/2a629138-9746-40f3-ad13-33c9c4d4b180.png',
    'Kimberly Mitchell': '/lovable-uploads/585eab8a-4417-41e5-9f7d-d353e3d174ba.png',
    'Kevin Perez': '/lovable-uploads/a50e0c74-b5e7-4331-945d-b456fb48765b.png',
    'Laura Roberts': '/lovable-uploads/85fbd059-f53e-48f2-9cb6-691d0c4ba899.png',
    'Steven Turner': '/lovable-uploads/379fa9c7-8b08-43d9-958a-2037e951a111.png',
    'Donna Phillips': '/lovable-uploads/d1e58bb8-b58b-4795-b76e-d057f3f102c5.png',
    'Timothy Campbell': '/lovable-uploads/eb6c53a7-5a99-4a8d-84c6-821cea326843.png',
    'Carol Parker': '/lovable-uploads/585eab8a-4417-41e5-9f7d-d353e3d174ba.png',
    'Jose Evans': '/lovable-uploads/2a629138-9746-40f3-ad13-33c9c4d4b180.png',
    'Ruth Edwards': '/lovable-uploads/85fbd059-f53e-48f2-9cb6-691d0c4ba899.png',
    'Kenneth Collins': '/lovable-uploads/a50e0c74-b5e7-4331-945d-b456fb48765b.png',
    'Sharon Stewart': '/lovable-uploads/d1e58bb8-b58b-4795-b76e-d057f3f102c5.png',
    'Brian Sanchez': '/lovable-uploads/379fa9c7-8b08-43d9-958a-2037e951a111.png',
    'Lisa Morris': '/lovable-uploads/585eab8a-4417-41e5-9f7d-d353e3d174ba.png',
    'Ronald Rogers': '/lovable-uploads/eb6c53a7-5a99-4a8d-84c6-821cea326843.png',
    'Betty Reed': '/lovable-uploads/85fbd059-f53e-48f2-9cb6-691d0c4ba899.png',
    'Jacob Cook': '/lovable-uploads/2a629138-9746-40f3-ad13-33c9c4d4b180.png',
    'Helen Bailey': '/lovable-uploads/d1e58bb8-b58b-4795-b76e-d057f3f102c5.png',
    'Gary Rivera': '/lovable-uploads/a50e0c74-b5e7-4331-945d-b456fb48765b.png',
    'Sandra Cooper': '/lovable-uploads/585eab8a-4417-41e5-9f7d-d353e3d174ba.png',
    'Nicholas Richardson': '/lovable-uploads/379fa9c7-8b08-43d9-958a-2037e951a111.png',
    'Deborah Cox': '/lovable-uploads/85fbd059-f53e-48f2-9cb6-691d0c4ba899.png',
    'Jonathan Howard': '/lovable-uploads/eb6c53a7-5a99-4a8d-84c6-821cea326843.png'
  };
  
  return profileMap[name] || '';
};

export const getUserInitials = (name: string): string => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};