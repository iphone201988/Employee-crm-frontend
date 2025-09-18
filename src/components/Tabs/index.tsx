const CustomTabs = ({ tabs, activeTab, setActiveTab }: any) => {
    return (
        <div className="border-b border-border mt-6 w-full">
            <div className="overflow-x-auto whitespace-nowrap">
                <div className="inline-flex">
                    {tabs.map((tab: any) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                                activeTab === tab.id
                                    ? "border-primary text-primary"
                                    : "border-transparent text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CustomTabs;