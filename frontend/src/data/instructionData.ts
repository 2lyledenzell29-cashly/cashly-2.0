export interface InstructionStep {
    header: string;
    body: string;
    image?: string;
}

export const instructionSteps: InstructionStep[] = [
    {
        header: "Welcome to Cashly!",
        body: "Your personal finance management app that helps you track expenses, manage budgets, and take control of your financial life. Let's get you started with a quick tour of the key features.",
    },
    {
        header: "Create Your First Wallet",
        body: "Start by creating your first wallet. Every user gets one wallet initially. You can organize your finances by creating separate wallets for different purposes like personal expenses, business, or savings goals.",
    },
    {
        header: "Set Up Custom Categories",
        body: "One of Cashly's unique features is the ability to create your own custom categories. Organize your transactions exactly how you want - whether it's 'Coffee & Treats', 'Gym Memberships', or 'Pet Expenses'. Make it personal!",
        image: "/images/instructions/category.png"
    },
    {
        header: "Track Your Transactions",
        body: "Log your income and expenses easily. Each transaction can be assigned to a category and wallet, giving you detailed insights into your spending patterns. You can also add notes for better organization.",
        image: "/images/instructions/transaction.png"
    },
    {
        header: "Create Smart Budgets",
        body: "Set monthly budgets for your categories and track your progress in real-time. Cashly will help you stay on track with visual indicators and alerts when you're approaching your limits.",
        image: "/images/instructions/budget.png"
    },
    {
        header: "Set Up Reminders",
        body: "Never miss a bill or important financial task again. Set up custom reminders for recurring expenses, bill due dates, or financial goals. Stay organized and on top of your finances.",
        image: "/images/instructions/reminder.png"
    },
    {
        header: "Multiple Wallets & Family Sharing",
        body: "Want more wallets? Email us at lyledenzell29@gmail.com to request additional wallet allowances. You can also create family wallets to share expenses and budgets with family members or roommates.",
        image: "/images/instructions/Family Wallets.png"
    },
    {
        header: "Dashboard Insights",
        body: "Get a comprehensive overview of your finances with interactive charts, spending breakdowns, and financial summaries. Export your data anytime for external analysis or record-keeping.",
        image: "/images/instructions/dashboard.png"
    },
    {
        header: "You're All Set!",
        body: "That's it! You're ready to take control of your finances with Cashly. Remember, you can always access these instructions again by clicking the help button in the sidebar. Happy budgeting!",
    }
];