import { signInWithGoogle } from "@/app/(auth)/actions";
import { SubmitButton } from "./submit-button";

export function GoogleButton({ next }: { next: string }) {
  return (
    <form action={signInWithGoogle}>
      <input type="hidden" name="next" value={next} />
      <SubmitButton variant="outline" className="w-full" pendingLabel="Opening Google">
        <span
          aria-hidden="true"
          className="grid size-5 place-items-center rounded-full bg-white text-xs font-bold text-[#1a1a1a]"
        >
          G
        </span>
        Continue with Google
      </SubmitButton>
    </form>
  );
}
