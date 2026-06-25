"use client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function DeleteConfirmModal({ isOpen, onClose, onConfirm, loading }) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="bg-zinc-900 border border-zinc-800 text-white rounded-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-zinc-100">Confirm Asset Deletion</AlertDialogTitle>
          <AlertDialogDescription className="text-zinc-400">
            Are you absolutely sure you want to drop this record node? This operation is permanent and cannot be undone in production logs.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading} className="bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700 rounded-xl">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm} 
            disabled={loading}
            className="rounded-xl bg-rose-600 hover:bg-rose-700 font-bold text-white"
          >
            {loading ? "Purging..." : "Destroy Record"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
