'use client'
import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import axios from "axios"
import { toast } from "sonner"
import { Trash2, Clock } from "lucide-react"

const MessageCard = ({ message, onMessageDelete }) => {

    const handleDeleteConfirm = async () => {
        try {
            const response = await axios.delete(`/api/delete-message/${String(message._id)}`)
            toast.success(response.data.message);
            onMessageDelete(String(message._id));
        } catch (error) {
            const axiosError = error
            toast.error('Error',{
                description:
                axiosError.response?.data?.message ?? 'Failed to delete message',
            });
        }
    }

    const formattedDate = new Date(message.createdAt).toLocaleString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
    });

    return (
        <Card className="bg-white dark:bg-[#1A1A1A] border-gray-200 dark:border-[#2A2A2A] rounded-2xl shadow-sm transition-colors group">
            <CardHeader className="p-5">
                <div className="flex justify-between items-start gap-4">
                    <CardTitle className="text-gray-900 dark:text-white text-lg font-medium leading-relaxed break-words">
                        "{message.content}"
                    </CardTitle>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button 
                                variant="ghost" 
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-full opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-white dark:bg-[#1A1A1A] border-gray-200 dark:border-[#2A2A2A] text-gray-900 dark:text-white rounded-2xl">
                            <AlertDialogHeader>
                                <AlertDialogTitle>Delete this message?</AlertDialogTitle>
                                <AlertDialogDescription className="text-gray-500 dark:text-[#A0A0A0]">
                                    This action cannot be undone. This will permanently delete this message from your dashboard.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel className="border-gray-200 dark:border-[#2A2A2A] hover:bg-gray-50 dark:hover:bg-[#252525] rounded-xl">Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-500 hover:bg-red-600 text-white rounded-xl border-0">Delete</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
                <CardDescription className="text-gray-500 dark:text-[#8A8A8A] text-xs mt-3 flex items-center gap-1.5 font-medium tracking-wide">
                    <Clock className="w-3.5 h-3.5 opacity-70" />
                    {formattedDate}
                </CardDescription>
            </CardHeader>
        </Card>
    )
}

export default MessageCard