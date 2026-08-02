import type { InvitationContent } from "../types";

export function AccountGroups({
  groups,
  onCopy,
}: {
  groups: InvitationContent["accounts"];
  onCopy: (accountNumber: string) => void | Promise<void>;
}) {
  return (
    <div className="account-groups">
      {groups.map((group) => (
        <section className="account-group" key={group.id}>
          <h3 className="account-group__title">{group.label}</h3>
          <div className="account-list">
            {group.items.map((account) => (
              <article className="account-card" key={account.id}>
                <div>
                  <span>{account.holder}</span>
                  <strong>{account.bank} {account.accountNumber}</strong>
                </div>
                <button
                  className="small-button"
                  type="button"
                  onClick={() => void onCopy(account.accountNumber)}
                >
                  복사
                </button>
                {account.paymentUrl ? (
                  <a className="small-button" href={account.paymentUrl} rel="noreferrer" target="_blank">
                    송금
                  </a>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
