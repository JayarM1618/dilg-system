<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class AccountActivation extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public User $user,
        public string $activationLink,
        public int $validDays = 7,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Activate your Talaghayan account',
        );
    }

    public function content(): Content
    {
        $where = $this->user->barangay
            ? "Barangay {$this->user->barangay->name}"
            : 'the DILG Makati office';

        return new Content(
            view: 'emails.activation',
            with: [
                'userName'  => $this->user->name,
                'userEmail' => $this->user->email,
                'where'     => $where,
                'link'      => $this->activationLink,
                'days'      => $this->validDays,
            ],
        );
    }
}
